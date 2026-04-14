# Camera AI

AI yordamida fotografiya o'rgatuvchi mobil ilova.

## Tech Stack
- **Mobile:** React Native + Expo
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Storage:** Appwrite Cloud
- **AI:** Anthropic Claude API

## Ishga tushirish

### 1. Backend .env yarating
```
cd backend
cp .env.example .env
```
`.env` faylini to'ldiring:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cameraai
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=any_secret_key
JWT_EXPIRES_IN=30d
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_id
APPWRITE_API_KEY=your_key
APPWRITE_BUCKET_ID=your_bucket
ANTHROPIC_API_KEY=your_claude_key
```

### 2. Backend ishga tushirish
```
cd backend
npm install
npm run dev
```
Server ishga tushganda DB jadvallar **avtomatik** yaratiladi.

### 3. Frontend .env yarating
```
cd frontend
cp .env.example .env
```
IP manzilingizni kiriting (ipconfig buyrug'i bilan aniqlang):
```
API_URL=http://192.168.X.X:5000/api
```

### 4. Frontend ishga tushirish
```
cd frontend
npm install
npx expo start
```

## APK qilish
```
cd frontend
eas build -p android --profile preview
```
