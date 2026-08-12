# Chatham Event Registration — Setup Guide
## Netlify + Google Sheets 연동 완전 가이드

---

## 📁 파일 구조

```
chatham-event/
├── index.html                          ← 이벤트 랜딩 페이지
├── register.html                       ← 등록 폼 페이지
├── netlify.toml                        ← Netlify 설정
├── netlify/
│   └── functions/
│       └── submit-registration.js      ← Netlify 서버리스 함수
├── google-apps-script/
│   └── Code.gs                         ← Google Apps Script
└── SETUP.md                            ← 이 파일
```

---

## STEP 1 — Google Sheets 설정

### 1-1. 새 Google Sheets 생성
1. [sheets.google.com](https://sheets.google.com) 접속
2. **새 스프레드시트** 생성
3. 이름: `Chatham Event Registrations`

### 1-2. Apps Script 설정
1. 스프레드시트 상단 메뉴 → **Extensions** → **Apps Script**
2. 기존 코드 전체 삭제
3. `google-apps-script/Code.gs` 파일 내용을 전체 복사 → 붙여넣기
4. 💾 저장 (Ctrl+S / Cmd+S)

### 1-3. Web App으로 배포
1. 우측 상단 **Deploy** 버튼 클릭
2. **New deployment** 선택
3. ⚙️ 톱니바퀴 아이콘 → **Web app** 선택
4. 설정:
   - **Description**: `Chatham Registration v1`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
5. **Deploy** 클릭
6. 권한 허용 팝업 → **Authorize access** → Google 계정 선택 → **Allow**
7. ✅ **Web app URL 복사** (나중에 필요)
   - 형식: `https://script.google.com/macros/s/XXXXX/exec`

---

## STEP 2 — Netlify 배포

### 2-1. GitHub에 업로드
```bash
# 이 폴더를 GitHub repo에 업로드
git init
git add .
git commit -m "Chatham event registration site"
git remote add origin https://github.com/YOUR_USERNAME/chatham-event.git
git push -u origin main
```

### 2-2. Netlify 연결
1. [app.netlify.com](https://app.netlify.com) 접속
2. **Add new site** → **Import an existing project**
3. **Deploy with GitHub** → 위에서 만든 repo 선택
4. 설정 확인:
   - **Branch**: `main`
   - **Publish directory**: `.`  (루트)
5. **Deploy site** 클릭

### 2-3. 환경변수 설정 (중요!)
1. Netlify 대시보드 → **Site configuration** → **Environment variables**
2. **Add a variable** 클릭:
   - **Key**: `GOOGLE_SHEETS_WEBHOOK_URL`
   - **Value**: Step 1-3에서 복사한 Google Apps Script URL
3. **Save** 클릭
4. **Deploys** 탭 → **Trigger deploy** → **Deploy site** (재배포 필요)

---

## STEP 3 — register.html 제출 연결 업데이트

register.html의 form action을 Netlify Function으로 변경:

```html
<!-- register.html 안의 fetch URL 수정 -->
<!-- 현재: fetch('/')  →  변경: fetch('/.netlify/functions/submit-registration') -->
```

`register.html` 파일 안에서 이 부분을 찾아서:
```javascript
const res = await fetch('/', {
```
이렇게 바꾸기:
```javascript
const res = await fetch('/.netlify/functions/submit-registration', {
```

---

## STEP 4 — 테스트

1. 배포된 Netlify URL로 접속 (예: `https://chatham-event.netlify.app`)
2. **Register Now** 버튼 클릭
3. 폼 작성 후 제출
4. Google Sheets에서 **Registrations** 시트 확인 ✅

---

## 선택사항 — 이메일 알림 설정

`google-apps-script/Code.gs` 안에서:
```javascript
const NOTIFY_EMAIL = '';  // ← 여기에 이메일 입력
// 예: const NOTIFY_EMAIL = 'kate@chathamproperties.com.au';
```
수정 후 Apps Script 재배포 필요.

---

## 문제 해결

| 문제 | 해결 방법 |
|------|----------|
| 폼 제출 후 오류 메시지 | Netlify 환경변수 확인, 재배포 |
| Sheets에 데이터 없음 | Apps Script URL 정확한지 확인, 배포 권한 재확인 |
| 함수 실행 오류 | Netlify → Functions → Logs에서 에러 확인 |
| Apps Script 권한 오류 | Apps Script → Deploy → Manage deployments → 삭제 후 재배포 |

---

## 완성 후 URL 구조

```
https://[your-site].netlify.app/           ← 이벤트 메인 페이지
https://[your-site].netlify.app/register   ← 등록 폼
```

---

*Chatham · Ventus Development · 2026*
