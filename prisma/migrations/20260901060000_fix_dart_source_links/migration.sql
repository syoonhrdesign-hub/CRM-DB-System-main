-- DART 근거 링크 교정
--
-- 기존 링크는 기업개황 화면에 회사명을 파라미터로 넘겼는데, 그 화면이 파라미터를
-- 읽지 않아 "일치하는 회사명이 없습니다" 가 떴다. 근거를 눌러 확인하는 동선이
-- 끊겼으므로 이미 저장된 링크도 함께 고친다.
--
--  1) 고유번호를 아는 경우: 기업개황을 고유번호로 바로 연다 (동명 법인 오인 없음)
--  2) 고유번호가 없는 경우: 회사명이 실제로 먹히는 공시서류검색 화면으로 보낸다

UPDATE "ResearchSource" AS s
SET url = 'https://dart.fss.or.kr/dsae001/selectPopup.ax?selectKey=' || r."corpCode"
FROM "CompanyResearch" AS r
WHERE s."researchId" = r.id
  AND s.publisher = 'DART'
  AND r."corpCode" IS NOT NULL
  AND s.url LIKE 'https://dart.fss.or.kr/dsae001/main.do?%';

UPDATE "ResearchSource"
SET url = REPLACE(url, '/dsae001/main.do?', '/dsab007/main.do?')
WHERE publisher = 'DART'
  AND url LIKE 'https://dart.fss.or.kr/dsae001/main.do?%';
