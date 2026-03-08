# MRTK Web v2 Kickoff (Reference: aircompkorea.co.kr)

## Status
- Branch: `develop`
- Base commit copied from stable: `2260763`
- Reference selected by owner: `http://www.aircompkorea.co.kr`

## 1) Reference IA Extract (1차)

### Top-level
- 회사소개
  - CEO 인사말
  - 품질인증서
  - 찾아오시는길
- 제품소개
  - 급유식 스크류
  - 공냉식 피스톤
  - 오일프리 스크류
  - AL TYPE
  - FE TYPE
  - 에어 드라이어
  - 에어 필터
- 기술자료
  - 기술자료
  - 시공사례
- 고객지원
  - 공지사항
  - 카달로그
  - 견적신청

## 2) v2 Scope (관리자 선행 금지)
1. 본페이지 정적 완성 먼저
2. 운영에서 자주 바꾸는 항목만 추출
3. 추출 포인트 기준으로 관리자 구축

## 3) 필수 관리포인트 (v2-1)
- 메뉴명/노출/하위메뉴 링크
- 페이지 제목/부제목/본문
- 대표 이미지(히어로)
- 찾아오시는길: 주소, 임베드 URL, 외부맵 링크(네이버/카카오/구글)
- 문의관리: 접수 목록, 상태, 메모
- 푸터/개인정보처리방침

## 4) 오늘 작업 목표 (Day 1)
- [ ] v2 메뉴 구조 확정
- [ ] 홈/회사소개/제품소개 정적 레이아웃 초안 반영
- [ ] map/inquiry는 자리만 잡고 상세는 Day 2로 이관
- [ ] 로컬/LAN 검증 후 체크포인트 커밋

## 5) 배포 규칙 (재발 방지)
- 미세 UI 수정은 로컬/LAN 검증 후 반영
- 체크포인트 단위 배포만 진행
- 배포 실패 시 코드 + 원문 에러코드 즉시 공유
- 관리자 상단 build 배지 유지
