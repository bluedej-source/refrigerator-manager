import { GoogleGenerativeAI } from "@google/generative-ai";

// 이미지를 base64로 변환해 Gemini API에 전송하고, 분석된 JSON 데이터를 반환합니다.
export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "제미나이(Gemini) API 키(GEMINI_API_KEY 환경변수)가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("image") as File | null;

  if (!file) {
    return Response.json({ error: "이미지가 첨부되지 않았습니다." }, { status: 400 });
  }

  try {
    // 1. 이미지를 바이트 배열 및 base64로 변환
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    // 2. 제미나이 AI 클라이언트 초기화
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 3. 제미나이에게 내릴 지시사항(프롬프트)
    const prompt = `당신은 마트 영수증에서 오직 식재료(음식 재료)만 추출하는 전문 AI입니다.
제공된 영수증 이미지를 분석하고 다음 JSON 형식으로 응답해 주세요. (반드시 마크다운 없이 순수 JSON만 반환)

{
  "items": [
    {
      "name": "식품명(예: 서울우유, 마늘 등 수식어 제거)",
      "price": 가격숫자(할인적용가, 콤마 없는 숫자형, 모르면 null),
      "qty": 수량(숫자형, 기본 1)
    }
  ],
  "total": 총합계(지불한 전체 총액 숫자, 모르면 null),
  "storeName": "가게이름(최상단 상호명 단어, 모르면 null)",
  "date": "YYYY-MM-DD 형식의 결제일자(모르면 null)"
}

<식재료 포함 기준 - 다음에 해당하는 것만 items에 추가>
- 신선식품: 채소, 과일, 육류, 수산물, 달걀, 두부 등
- 유제품: 우유, 치즈, 요거트, 버터 등
- 가공식품: 라면, 과자, 통조림, 음료, 주스, 주류 등
- 양념/조미료: 간장, 된장, 고추장, 소금, 설탕, 식용유, 식초 등
- 즉석식품/밀키트: 즉석밥, 냉동식품, 밀키트 등
- 빵/면류: 식빵, 국수, 파스타 등

<반드시 제외할 항목 - 절대 items에 추가하지 말 것>
- 생활용품: 세제, 샴푸, 린스, 비누, 치약, 칫솔, 면도기, 화장품, 기저귀, 생리대
- 주방용품: 랩, 호일, 지퍼백, 쓰레기봉투, 행주, 수세미
- 포장/봉투: 비닐봉투, 쇼핑백, 박스
- 서비스/수수료: 포인트적립, 배달비, 환경부담금, 부가세(별도 항목), 보증금
- 비식품 잡화: 전지, 건전지, 문구류, 의약품, 마스크, 장갑(고무장갑 등)
- 기타: 영수증에 나오는 소계, 합계, 할인, 적립 등 계산 항목

판단이 애매한 경우 식재료가 아니라고 판단하여 제외하세요.
금액은 모두 숫자형(number)입니다. 콤마나 문자를 포함하지 마세요.`;

    // 4. API에 이미지와 프롬프트를 함께 전송
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64,
          mimeType: mimeType,
        },
      },
    ]);

    // 5. 응답 텍스트 파싱
    let text = result.response.text();
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    
    const parsed = JSON.parse(text);

    return Response.json(parsed);
  } catch (err: any) {
    console.error("[scan-receipt] 제미나이 API 처리 오류:", err.message || err);

    return Response.json(
      { error: "영수증 분석 중 오류가 발생했습니다: " + (err.message || "") },
      { status: 502 }
    );
  }
}
