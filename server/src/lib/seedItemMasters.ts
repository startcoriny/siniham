// ItemMaster 정적 카탈로그를 DB에 채운다. 여러 번 실행해도 안전(upsert)
import { ITEM_MASTERS } from "@shared/types/cage";
import { prisma } from "./prisma";

export async function seedItemMasters() {
  for (const item of Object.values(ITEM_MASTERS)) {
    await prisma.itemMaster.upsert({
      where: { id: item.id },
      update: { name: item.name, cost: item.cost, purchasable: item.purchasable },
      create: {
        id: item.id,
        name: item.name,
        cost: item.cost,
        purchasable: item.purchasable,
      },
    });
  }
}
