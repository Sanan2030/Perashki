# SprintPointer

Bu nüsxə Perashki daxilində `/tools/sprint-pointer/` ünvanında işləyir və ortaq tema ilə JSON ehtiyat nüsxəsinə qoşulub. Deploy konfiqurasiyası repozitoriyanın kökündəki `vercel.json` faylındadır. Mənbədən yeniləmək üçün kök qovluqda `npm run sync:app -- sprint-pointer` işlədin. Lokal serverin `/` ünvanı tətbiqin prefiksinə yönləndirilir; `PERASHKI_BASE_PATH` ilə dəyişmək mümkündür.

Azure DevOps tapşırıqları üçün Azərbaycan dilində iş təsviri, qəbul meyarları, müddət və Story Point hazırlayan tətbiq. Nəticəni redaktə edib Azure DevOps-a köçürmək mümkündür. Son 20 qiymətləndirmə bu brauzerin localStorage yaddaşında saxlanır.

## Lokal işə salma

Node.js 24 və npm tələb olunur.

```sh
npm ci
npm run dev
```

Brauzerdə `http://localhost:3000` ünvanını açın. Vite və Express eyni portda işləyir. Hazır build-i lokal yoxlamaq üçün `npm run build` və `npm start` işlədin. Portu `PORT` ilə dəyişmək mümkündür.

## Story Point hesablaması

| Müddət | Qayda | Nümunə |
| --- | --- | --- |
| 8 saatdan az | saat × 0.1 | 6 saat → 0.6 |
| 8 saat və daha uzun | saat ÷ 8 | 8 saat → 1, 12 saat → 1.5 |

Müddət tam saatla təxmin edilir. Bir iş günü 8 saatdır. Nəticə iki onluq rəqəmə qədər yuvarlaqlaşdırılır. Server, interfeys və kopyalanan mətn `lib/points.js` faylındakı eyni funksiyadan istifadə edir.

## Yerli və AI qiymətləndirməsi

Açar olmadan yerli rejim işləyir. Başlıq və kontekst dəstəklənən açar sözlər üzrə yoxlanır. İş növü, əhatə və əlavə amillər təxmini dəyişə bilər. Açar sözlərdən kənar məna, inkar, biznes qaydaları və layihəyə xas asılılıqlar yerli rejimdə avtomatik şərh olunmur. Naməlum tapşırıq üçün ümumi təxmin, daha geniş interval və dəqiqləşdirmə sualları verilir.

AI rejimi üçün `.env.example` faylının surətini `.env` kimi yaradın və server dəyişənlərini təyin edin.

| Dəyişən | Məqsəd |
| --- | --- |
| `OPENAI_API_KEY` | İstəyə bağlıdır. Təyin edildikdə OpenAI Responses API aktivləşir. |
| `OPENAI_MODEL` | İstəyə bağlıdır. Standart model `gpt-4.1-mini`-dır. Seçilən model Structured Outputs dəstəkləməlidir. |

AI rejimində başlıq, kontekst və forma seçimləri OpenAI-a göndərilir. Sorğuda `store: false` istifadə edilir. Açar server mühitində saxlanır. `VITE_` prefiksi istifadə edilməməlidir. AI qiymətləndirməsi uğursuz olduqda interfeys xəta göstərir.

`GET /api/health` server statusunu və konfiqurasiya edilmiş rejimi qaytarır. `aiConfigured` açarın mövcudluğunu göstərir. Health endpoint-i canlı OpenAI sorğusu etmir və `aiVerified: false` qaytarır. `POST /api/estimate` tapşırıq məlumatlarını qəbul edir.

## Yoxlamalar

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

Brauzer testi hazır build-i müvəqqəti lokal portda işə salır. Sistemdə quraşdırılmış Chromium üçün `CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser` istifadə edilə bilər. API testləri AI cavablarını simulyasiya edir və real açara ehtiyac duymur.

## Vercel

1. Vercel-də GitHub-dakı SprintPointer repozitoriyasını import edin. Layihənin kök qovluğunu və Node.js 24.x versiyasını seçin.
2. Framework kimi Vite seçin. `vercel.json` build əmrini, `dist` çıxışını və `/api/*` yönləndirməsini təyin edir.
3. AI rejimi tələb olunursa, Vercel Environment Variables bölməsində `OPENAI_API_KEY` və istəyə bağlı `OPENAI_MODEL` əlavə edin.
4. Deploy tamamlandıqda `/api/health` ünvanını və tətbiqdən bir qiymətləndirmə sorğusunu yoxlayın.

API `api/index.js` funksiyasında işləyir. OpenAI sorğusunun limiti 25 saniyə, Vercel funksiyasının limiti 45 saniyədir. Verilənlər bazası və daimi server prosesi tələb olunmur.
