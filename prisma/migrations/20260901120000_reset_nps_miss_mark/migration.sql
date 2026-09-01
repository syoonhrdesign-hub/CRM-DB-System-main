-- 국민연금 "미확인" 표시 초기화
--
-- 조회가 실패한 이유는 회사가 없어서가 아니라, 우리가 부른 조건 이름이
-- 옛 표기였기 때문이다(V2 로 옮기면서 wkpl_nm → wkplNm 으로 바뀜).
-- 그때 붙은 "미확인" 표시가 남아 있으면 고친 뒤에도 다시 조회하지 않는다.
-- 사람이 적어 둔 다른 메모는 건드리지 않고 그 줄만 걷어낸다.

UPDATE "CompanyResearch"
SET gaps = NULLIF(
  array_to_string(
    ARRAY(
      SELECT line
      FROM unnest(string_to_array(gaps, E'\n')) AS line
      WHERE line NOT LIKE '국민연금 사업장 검색 — 미확인%'
    ),
    E'\n'
  ),
  ''
)
WHERE gaps LIKE '%국민연금 사업장 검색 — 미확인%';
