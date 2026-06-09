import { sequelize } from '../../config/database';
import { Item, TeamSnapshot, User, UserItem } from '../../database/models';
import type {
  SnapshotAthlete,
  SnapshotAthleteBonus,
  SnapshotPositions
} from '../../database/models/team-snapshot.model';
import { canApplyItem, mergeBonus, type ItemModifiers } from './itens.logic';

export type ItemServiceErrorCode =
  | 'USER_NOT_FOUND'
  | 'ITEM_NOT_FOUND'
  | 'ITEM_INACTIVE'
  | 'INSUFFICIENT_COINS'
  | 'NO_INVENTORY_ITEM'
  | 'NO_SNAPSHOT'
  | 'ATHLETE_NOT_IN_SNAPSHOT'
  | 'STACK_NOT_ALLOWED';

export type ItemServiceErrorOptions = {
  i18nKey?: string;
  params?: Record<string, unknown>;
};

export class ItemServiceError extends Error {
  public readonly code: ItemServiceErrorCode;
  public readonly i18nKey: string;
  public readonly params?: Record<string, unknown>;

  constructor(code: ItemServiceErrorCode, options: ItemServiceErrorOptions = {}) {
    const i18nKey = options.i18nKey ?? `itens.errors.${code}`;
    super(i18nKey);
    this.name = 'ItemServiceError';
    this.code = code;
    this.i18nKey = i18nKey;
    this.params = options.params;
  }
}

const itemModifiers = (item: Item): ItemModifiers => ({
  attack: item.modifier_attack,
  defense: item.modifier_defense,
  velocity: item.modifier_velocity
});

export type ItemDTO = {
  id: number;
  name: string;
  description: string;
  cost: number;
  stackable: boolean;
  modifiers: ItemModifiers;
};

const toItemDTO = (item: Item): ItemDTO => ({
  id: item.id,
  name: item.name,
  description: item.description,
  cost: item.cost,
  stackable: item.stackable,
  modifiers: itemModifiers(item)
});

/** Catalogo de itens ativos na loja. */
export const listarItens = async (): Promise<ItemDTO[]> => {
  const items = await Item.findAll({
    where: { is_active: true },
    order: [
      ['cost', 'ASC'],
      ['id', 'ASC']
    ]
  });
  return items.map(toItemDTO);
};

export type ComprarItemResult = {
  user: { id: number; coins: number };
  item: ItemDTO;
  inventoryItemId: number;
};

/**
 * RF014 — compra de item na loja. Debita coins e cria a instancia no inventario
 * (consumed=false) dentro de uma transacao para nao perder dinheiro nem item.
 */
export const comprarItem = async (
  userId: number,
  itemId: number
): Promise<ComprarItemResult> => {
  return sequelize.transaction(async (transaction) => {
    const user = await User.findByPk(userId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!user) {
      throw new ItemServiceError('USER_NOT_FOUND', {
        i18nKey: 'itens.buy.userNotFound'
      });
    }

    const item = await Item.findByPk(itemId, { transaction });
    if (!item) {
      throw new ItemServiceError('ITEM_NOT_FOUND', {
        i18nKey: 'itens.buy.itemNotFound',
        params: { itemId }
      });
    }
    if (!item.is_active) {
      throw new ItemServiceError('ITEM_INACTIVE', {
        i18nKey: 'itens.buy.itemInactive'
      });
    }

    if (user.coins < item.cost) {
      throw new ItemServiceError('INSUFFICIENT_COINS', {
        i18nKey: 'itens.buy.insufficientBalance'
      });
    }

    user.coins -= item.cost;
    await user.save({ transaction });

    const inventoryItem = await UserItem.create(
      { user_id: userId, item_id: item.id, consumed: false },
      { transaction }
    );

    return {
      user: { id: user.id, coins: user.coins },
      item: toItemDTO(item),
      inventoryItemId: inventoryItem.id
    };
  });
};

const findAthleteCell = (
  positions: SnapshotPositions,
  athleteId: number
): SnapshotAthlete | null => {
  for (const row of positions) {
    for (const cell of row) {
      if (cell && cell.id === athleteId) {
        return cell;
      }
    }
  }
  return null;
};

/** Clona o grid para mutar com seguranca antes de persistir o JSON. */
const clonePositions = (positions: SnapshotPositions): SnapshotPositions =>
  positions.map((row) =>
    row.map((cell) =>
      cell
        ? {
            ...cell,
            bonus: cell.bonus ? { ...cell.bonus } : undefined,
            appliedItemIds: cell.appliedItemIds ? [...cell.appliedItemIds] : undefined
          }
        : null
    )
  );

export type AplicarItemResult = {
  snapshotId: number;
  athlete: {
    id: number;
    name: string;
    bonus: SnapshotAthleteBonus;
    appliedItemIds: number[];
  };
  item: { id: number; name: string; modifiers: ItemModifiers };
  consumedInventoryItemId: number;
};

/**
 * RF014 — aplica o bonus de um item a um atleta do snapshot da rodada atual.
 * Em uma unica transacao: valida posse/uso (instancia nao consumida), valida o
 * empilhamento (stacking), atrela o buff ao atleta no Snapshot e consome o item.
 */
export const aplicarItem = async (
  userId: number,
  itemId: number,
  athleteId: number
): Promise<AplicarItemResult> => {
  return sequelize.transaction(async (transaction) => {
    const item = await Item.findByPk(itemId, { transaction });
    if (!item) {
      throw new ItemServiceError('ITEM_NOT_FOUND', {
        i18nKey: 'itens.apply.itemNotFound',
        params: { itemId }
      });
    }
    if (!item.is_active) {
      throw new ItemServiceError('ITEM_INACTIVE', {
        i18nKey: 'itens.apply.itemInactive'
      });
    }

    // Posse e uso: instancia ainda nao consumida no inventario do usuario.
    const inventoryItem = await UserItem.findOne({
      where: { user_id: userId, item_id: itemId, consumed: false },
      order: [['id', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!inventoryItem) {
      throw new ItemServiceError('NO_INVENTORY_ITEM', {
        i18nKey: 'itens.apply.noInventoryItem'
      });
    }

    // Snapshot da rodada atual (mais recente do usuario).
    const snapshot = await TeamSnapshot.findOne({
      where: { user_id: userId },
      order: [
        ['created_at', 'DESC'],
        ['id', 'DESC']
      ],
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!snapshot) {
      throw new ItemServiceError('NO_SNAPSHOT', {
        i18nKey: 'itens.apply.noSnapshot'
      });
    }

    const positions = clonePositions(snapshot.positions);
    const target = findAthleteCell(positions, athleteId);
    if (!target) {
      throw new ItemServiceError('ATHLETE_NOT_IN_SNAPSHOT', {
        i18nKey: 'itens.apply.athleteNotInSnapshot',
        params: { athleteId }
      });
    }

    // Stacking: item nao-stackable nao pode repetir no mesmo atleta na rodada.
    if (!canApplyItem(target, itemId, item.stackable)) {
      throw new ItemServiceError('STACK_NOT_ALLOWED', {
        i18nKey: 'itens.apply.stackNotAllowed',
        params: { name: item.name }
      });
    }

    const mods = itemModifiers(item);
    target.bonus = mergeBonus(target.bonus, mods);
    target.appliedItemIds = [...(target.appliedItemIds ?? []), itemId];

    snapshot.set('positions', positions);
    snapshot.changed('positions', true);
    await snapshot.save({ transaction });

    inventoryItem.consumed = true;
    inventoryItem.athlete_id = athleteId;
    inventoryItem.snapshot_id = snapshot.id;
    inventoryItem.consumed_at = new Date();
    await inventoryItem.save({ transaction });

    return {
      snapshotId: snapshot.id,
      athlete: {
        id: target.id,
        name: target.name,
        bonus: target.bonus,
        appliedItemIds: target.appliedItemIds
      },
      item: { id: item.id, name: item.name, modifiers: mods },
      consumedInventoryItemId: inventoryItem.id
    };
  });
};
