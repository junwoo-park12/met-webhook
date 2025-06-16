const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// 네 스프레드시트 ID와 시트 이름
const spreadsheetId = '1iR1OAc0Qu-aN7wOSyi5tbeixWbB-9v8-JnoD9X_m0wc';
const sheetName = 'DB_META';

app.post('/webhook', async (req, res) => {
  const data = req.body;

  // 메타 양식 필드 값 추출
  const createdTime = data.created_time || '';
  const campaign = data.ad_id || data.form_id || ''; // 광고 식별자
  const region = data.field_data?.find(f => f.name === '방문지역')?.values?.[0] || '';
  const name = data.field_data?.find(f => f.name === '이름')?.values?.[0] || '';
  const phone = data.field_data?.find(f => f.name === '휴대폰번호')?.values?.[0] || '';

  // A, C, D, E, F 열에 맞춰 구성
  const values = [[
    createdTime, // A열: 수신시간
    campaign,    // C열: 광고
    region,      // D열: 지역
    name,        // E열: 이름
    phone        // F열: 전화번호
  ]];

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });

    console.log('✅ 리드 저장 완료:', values);
    res.status(200).send('ok');
  } catch (err) {
    console.error('❌ Google Sheets 저장 실패:', err);
    res.status(500).send('error');
  }
});

app.get('/', (req, res) => {
  res.send('Meta Webhook Server Running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook 서버 실행 중 - 포트 ${PORT}`);
});
