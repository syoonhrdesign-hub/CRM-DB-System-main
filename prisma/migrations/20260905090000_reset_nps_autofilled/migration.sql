-- 국민연금 자동 채우기 값을 한 번 비운다.
--
-- 이전 대조 규칙은 "삼성전자서비스 강남센터" 같은 다른 법인의 사업장을 합산할 수
-- 있었고, 사업장이 15곳을 넘는 회사는 일부만 더한 값을 전체처럼 저장했다.
-- 어느 행이 잘못됐는지 사후에 가려낼 수 없으므로, 자동으로 채운 값(근거가
-- 국민연금공단인 행)만 비우고 고친 규칙으로 다시 돌리게 한다.
-- 사람이 직접 적은 가입자 수(국민연금 근거가 없는 행)는 건드리지 않는다.

UPDATE "CompanyResearch" r
SET "pensionSubscribers" = NULL,
    "pensionAsOf" = NULL
WHERE EXISTS (
  SELECT 1 FROM "ResearchSource" s
  WHERE s."researchId" = r.id AND s."publisher" = '국민연금공단'
);

DELETE FROM "ResearchSource" WHERE "publisher" = '국민연금공단';
