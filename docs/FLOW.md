# 사용자 여정 및 로직 흐름 (Sequence Diagram)
sequenceDiagram
    participant U as User
    participant FE as Frontend (v0 UI)
    participant BE as Backend (Supabase)
    participant RULE as Rule-based Engine
    participant AI as Generative AI API

    U->>FE: Google Login
    FE->>BE: OAuth 인증 요청
    BE-->>FE: 인증 토큰 반환

    U->>FE: 보유 향수 등록
    FE->>BE: 향수 메타데이터 저장 (노트, 계열, 분위기)

    U->>FE: 취향 입력
    FE->>BE: 취향 데이터 저장 (선호/비선호/상황)

    FE->>RULE: 취향 + 향수 데이터 전달
    RULE-->>FE: 추천/비추천 결과 (점수 기반)

    FE->>AI: (입력) 취향 요약 + 향수 노트 + 추천 결과
    AI-->>FE: 자연어 설명 텍스트

    FE->>BE: AI 설명 결과 저장
    FE-->>U: 추천 결과 + 설명 UI 표시

# 서비스 아키텍처 및 페이지 구조 (Flowchart)
flowchart TD
    A[Landing Page] --> B[Google Login]
    B --> C[Dashboard]

    C --> D[My Perfumes]
    C --> E[Preference Input]
    C --> F[Recommendation Result]

    D --> D1[Add / Edit Perfume]
    E --> E1[Preferred Notes]
    E --> E2[Disliked Notes]
    E --> E3[Usage Context]

    F --> G[Rule-based Recommendation Engine]
    G --> H[Recommendation Decision]

    H --> I[AI Explanation Module]
    I --> J[Explanation View UI]

    subgraph Backend
        G
        I
    end

    subgraph External
        K[Generative AI API]
    end

    I --> K
    K --> I
