-- 케이지 자율 행동(모래목욕, 씨앗 볼에 담기, 전망대 둘러보기, 쳇바퀴, 집)의 쿨다운 기준 시각.
ALTER TABLE "Hamster" ADD COLUMN "lastIdleAt" TIMESTAMP(3);
