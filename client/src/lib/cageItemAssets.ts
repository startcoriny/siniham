// 케이지 가구 이미지. 케이지 스테이지와 상점 카드가 같은 그림을 쓴다.
import type { ItemId } from "@shared/types/cage";
import foodBowlImage from "../assets/cage-items/food-bowl.png";
import houseImage from "../assets/cage-items/house.png";
import waterBottleImage from "../assets/cage-items/water-bottle.png";
import handheldWaterBottleImage from "../assets/cage-items/handheld-water-bottle.png";
import waterBowlImage from "../assets/cage-items/water-bowl.png";
import wheelImage from "../assets/cage-items/wheel.png";
import sandBathImage from "../assets/cage-items/sand-bath.png";
import snackDishImage from "../assets/cage-items/snack-dish.png";
import lookoutImage from "../assets/cage-items/lookout.png";

export const CAGE_ITEM_IMAGE: Record<ItemId, string> = {
  FOOD_BOWL: foodBowlImage,
  WATER_BOTTLE: waterBottleImage,
  HANDHELD_WATER_BOTTLE: handheldWaterBottleImage,
  WATER_BOWL: waterBowlImage,
  HOUSE: houseImage,
  WHEEL: wheelImage,
  SAND_BATH: sandBathImage,
  SNACK_DISH: snackDishImage,
  LOOKOUT: lookoutImage,
};
