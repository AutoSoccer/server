import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildItem } from '../../__tests__/factories/item';
import { buildUser } from '../../__tests__/factories/user';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  findUser: vi.fn(),
  findItem: vi.fn(),
  findAllItems: vi.fn(),
  createUserItem: vi.fn(),
  findUserItem: vi.fn(),
  findSnapshot: vi.fn()
}));

vi.mock('../../config/database', () => ({
  sequelize: {
    transaction: mocks.transaction
  }
}));

vi.mock('../../database/models', () => ({
  Item: {
    findByPk: mocks.findItem,
    findAll: mocks.findAllItems
  },
  TeamSnapshot: {
    findOne: mocks.findSnapshot
  },
  User: {
    findByPk: mocks.findUser
  },
  UserItem: {
    create: mocks.createUserItem,
    findOne: mocks.findUserItem
  }
}));

import {
  aplicarItem,
  comprarItem,
  ItemServiceError,
  listarItens
} from './itens.service';

const setupTransaction = () => {
  mocks.transaction.mockImplementation(async (callback) =>
    callback({ LOCK: { UPDATE: 'UPDATE' } })
  );
};

describe('listarItens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista somente itens ativos como DTOs', async () => {
    mocks.findAllItems.mockResolvedValue([buildItem({ id: 1 }), buildItem({ id: 2 })]);

    const result = await listarItens();

    expect(mocks.findAllItems).toHaveBeenCalledWith(
      expect.objectContaining({ where: { is_active: true } })
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 1,
        modifiers: expect.objectContaining({ velocity: 5 })
      })
    );
  });
});

describe('comprarItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupTransaction();
  });

  it('rejeita usuario inexistente', async () => {
    mocks.findUser.mockResolvedValue(null);

    await expect(comprarItem(1, 1)).rejects.toMatchObject({
      code: 'USER_NOT_FOUND'
    });
  });

  it('rejeita item inativo', async () => {
    mocks.findUser.mockResolvedValue(buildUser({ id: 1, coins: 10 }));
    mocks.findItem.mockResolvedValue(buildItem({ id: 1, is_active: false }));

    await expect(comprarItem(1, 1)).rejects.toMatchObject({
      code: 'ITEM_INACTIVE'
    });
  });

  it('rejeita saldo insuficiente', async () => {
    const user = buildUser({ id: 1, coins: 0 });
    mocks.findUser.mockResolvedValue(user);
    mocks.findItem.mockResolvedValue(buildItem({ id: 1, cost: 5 }));

    await expect(comprarItem(1, 1)).rejects.toMatchObject({
      code: 'INSUFFICIENT_COINS'
    });
    expect(user.save).not.toHaveBeenCalled();
  });

  it('debita coins e cria UserItem no inventario', async () => {
    const user = buildUser({ id: 1, coins: 10 });
    mocks.findUser.mockResolvedValue(user);
    mocks.findItem.mockResolvedValue(buildItem({ id: 1, cost: 3 }));
    mocks.createUserItem.mockResolvedValue({ id: 555 });

    const result = await comprarItem(1, 1);

    expect(user.coins).toBe(7);
    expect(user.save).toHaveBeenCalled();
    expect(mocks.createUserItem).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 1, item_id: 1, consumed: false }),
      expect.any(Object)
    );
    expect(result.user.coins).toBe(7);
    expect(result.inventoryItemId).toBe(555);
  });
});

describe('aplicarItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupTransaction();
  });

  const buildSnapshot = (positionsOverride?: unknown) => ({
    id: 77,
    positions: positionsOverride ?? [
      [
        {
          id: 100,
          name: 'Atleta 1',
          velocity: 50,
          attack: 50,
          defense: 50,
          type: 'midfielder'
        },
        null,
        null
      ],
      [null, null, null],
      [null, null, null]
    ],
    set: vi.fn(),
    changed: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined)
  });

  const buildInventoryItem = () => ({
    id: 9,
    consumed: false,
    athlete_id: null as number | null,
    snapshot_id: null as number | null,
    consumed_at: null as Date | null,
    save: vi.fn().mockResolvedValue(undefined)
  });

  it('rejeita quando o atleta nao esta posicionado no snapshot', async () => {
    mocks.findItem.mockResolvedValue(buildItem({ id: 1, stackable: false }));
    mocks.findUserItem.mockResolvedValue(buildInventoryItem());
    mocks.findSnapshot.mockResolvedValue(buildSnapshot());

    await expect(aplicarItem(1, 1, 999)).rejects.toMatchObject({
      code: 'ATHLETE_NOT_IN_SNAPSHOT'
    });
  });

  it('rejeita item nao-stackable ja aplicado no mesmo atleta', async () => {
    const positions = [
      [
        {
          id: 100,
          name: 'Atleta 1',
          velocity: 50,
          attack: 50,
          defense: 50,
          appliedItemIds: [1]
        },
        null,
        null
      ],
      [null, null, null],
      [null, null, null]
    ];
    mocks.findItem.mockResolvedValue(buildItem({ id: 1, stackable: false }));
    mocks.findUserItem.mockResolvedValue(buildInventoryItem());
    mocks.findSnapshot.mockResolvedValue(buildSnapshot(positions));

    await expect(aplicarItem(1, 1, 100)).rejects.toMatchObject({
      code: 'STACK_NOT_ALLOWED'
    });
  });

  it('rejeita quando nao existe snapshot da rodada', async () => {
    mocks.findItem.mockResolvedValue(buildItem({ id: 1 }));
    mocks.findUserItem.mockResolvedValue(buildInventoryItem());
    mocks.findSnapshot.mockResolvedValue(null);

    await expect(aplicarItem(1, 1, 100)).rejects.toMatchObject({
      code: 'NO_SNAPSHOT'
    });
  });

  it('aplica modificadores via mergeBonus e consome o item', async () => {
    const inventoryItem = buildInventoryItem();
    const snapshot = buildSnapshot();
    mocks.findItem.mockResolvedValue(
      buildItem({
        id: 1,
        name: 'Chuteira',
        modifier_attack: 3,
        modifier_defense: 0,
        modifier_velocity: 5,
        stackable: false
      })
    );
    mocks.findUserItem.mockResolvedValue(inventoryItem);
    mocks.findSnapshot.mockResolvedValue(snapshot);

    const result = await aplicarItem(1, 1, 100);

    expect(snapshot.set).toHaveBeenCalled();
    expect(snapshot.save).toHaveBeenCalled();
    expect(inventoryItem.consumed).toBe(true);
    expect(inventoryItem.snapshot_id).toBe(77);
    expect(inventoryItem.athlete_id).toBe(100);
    expect(result.athlete.bonus).toEqual({ attack: 3, defense: 0, velocity: 5 });
    expect(result.athlete.appliedItemIds).toEqual([1]);
    expect(result.consumedInventoryItemId).toBe(9);
  });

  it('lanca ItemServiceError quando o item nao existe', async () => {
    mocks.findItem.mockResolvedValue(null);

    await expect(aplicarItem(1, 1, 100)).rejects.toBeInstanceOf(ItemServiceError);
  });
});
