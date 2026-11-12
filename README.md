# Perashki

Bir Vercel layihəsində işləyən şəxsi iş məkanı: solda ortaq menyu, daxilində Sloth AI, Visio Generator, Overtimer, Level Up, Azərbaycan təqvimi, to-do və SprintPointer. Beş repozitoriyanın tam kodu `apps/` daxilindədir; tətbiqlər öz səhifələri, Worker-ləri və API-ləri ilə bu saytın daxilində işləyir. Verilənlər bazası və hesab tələb olunmur.

## Ortaq light/dark tema

Başlıqdakı rejim düyməsi bütün bölmələri birlikdə dəyişir. Overtimer-in açıq yaşıl/ağ və tünd lacivərd/yaşıl rəng palitrası ortaqdır. Tətbiqlərin funksiyaları və daxilindəki bölmələr saxlanılıb. Menyudan seçilən tətbiq iş məkanının daxilində açılır; ayrıca səhifə açmaq lazım deyil.

Seçim bu brauzerdə saxlanır və ümumi JSON nüsxəsinə daxildir. Əvvəlki Overtimer, Level Up və Sloth AI tema seçimləri də oxunur. Seçim edilməyibsə sistemin light/dark rejimi izlənir. Tətbiqlərin öz tema düymələri də ortaq seçimi yeniləyir; dəyişiklik yazıları və qaralamaları yenidən yükləmir.

## Mənbə repozitoriyalarından yeniləmə

Məsələn, SlothAI-nin `main` branch-inə yenilik push etdikdən sonra Perashki-də **Actions → Sync imported app → Run workflow → sloth-ai** seç. Workflow yeni dəyişiklikləri ayrıca budağa birləşdirir, test/typecheck/build edir və pull request açır. PR-ni yoxlayıb `main`-ə merge etdikdə yenilik ümumi tətbiqə daxil olur. Bu əməliyyat hər mənbə push-undan sonra əl ilə başladılır.

Lokal variant:

```sh
npm run sync:app -- sloth-ai --check
npm run sync:app -- sloth-ai
```

Digər seçimlər: `visio-generator`, `overtimer`, `level-up`, `sprint-pointer`. Əmr ayrıca iş qovluğu/budaq yaradır, göstərilən qovluqda dəyişiklikləri yoxlamaq və commit/push etmək olur. Əsas qovluq dəyişmir. Tema və inteqrasiya dəyişiklikləri üçtərəfli Git birləşdirməsi ilə qorunur; eyni sətirlərə toxunulubsa konflikt əl ilə həll edilir. [Ətraflı təlimat](docs/upstream-sync.md).

## Bütün məlumatlar bir JSON-da

Başlıqdakı **Yüklə** düyməsi bütün bölmələri bir `perashki-YYYY-MM-DD.json` faylında saxlayır. **İdxal et** düyməsindən həmin faylı seçdikdə bütün bölmələr birlikdə bərpa olunur və əvvəl açıq olan bölmə göstərilir.

Fayla Overtimer qeydləri/profil/maaşlar, bütün Visio diaqramları və açıq diaqramın ünvanı, Level Up irəliləyişi/qeydləri/test nəticələri, Sloth AI mətn-mail qaralamaları/formatlanmış nəticələri/şəxsi lüğəti/jurnalı/test nümunələri, to-do tapşırıqları, SprintPointer işləri, təqvim ili və görünüş seçimləri daxildir.

İdxal əvvəlcə bütün faylı tətbiqlərin öz format yoxlayıcıları ilə yoxlayır. Etibarlı nüsxə saytın məlumatlarını bütöv əvəz edir; köhnə nüsxədə olmayan yeni qeydlər də çıxarılır. Yazma uğursuz olarsa əvvəlki məlumatlar geri qaytarılır. Başqa proqramların brauzer yaddaşına toxunulmur. Açıq tətbiqlər bərpadan əvvəl dayandırılır ki, gecikmiş avtomatik yazma bərpa olunan məlumatı əvəz etməsin.

JSON əməliyyatları brauzerdə aparılır; fayl serverə yüklənmir. Başqa brauzerdə/cihazda ümumi faylı idxal etmək lazımdır. Köhnə ayrıca tətbiqlərin JSON faylları onların əvvəlki idxal funksiyalarında işləyir. Ortaq idxal düyməsi ümumi Perashki faylını qəbul edir.

## SprintPointer

Mənbə [SprintPointer](https://github.com/Sanan2030/SprintPointer) tətbiqi menyunun daxilində açılır. Azure DevOps üçün iş təsviri, qəbul meyarları, tam saatla müddət və Story Point hesablayır. 8 saatdan az işdə saat × 0.1, 8 saatdan başlayaraq saat ÷ 8 qaydası tətbiq edilir. Nəticəni redaktə edib kopyalamaq, son 20 qiymətləndirməni tarixçədən açmaq mümkündür.

Açar olmadan yerli qiymətləndirmə işləyir. İstəyə bağlı server dəyişənləri `OPENAI_API_KEY` və `OPENAI_MODEL` AI qiymətləndirməsini aktivləşdirir; bu rejimdə başlıq və kontekst OpenAI-a göndərilir. Açar brauzerə verilmir. Dəyişənlərə `VITE_` prefiksi əlavə etmə.

Tarixçə ümumi JSON ehtiyat nüsxəsinə daxildir. Əvvəlki yerli StoryPointer qeydləri olan brauzerdə tətbiqin altındakı **Əvvəlki StoryPointer qeydləri** bölməsindən həmin işləri açmaq və kopyalamaq olar. Köhnə qeydlər də ehtiyat nüsxədə saxlanır.

## Vercel Services

Kökdəki [vercel.json](vercel.json) bir Vercel layihəsində altı müstəqil servis (portal, dörd Next.js tətbiqi və SprintPointer üçün Vite/Express) təyin edir. Repozitoriyanın Root Directory-si `./`, Node.js versiyası `24.x` olmalıdır. Build/install/dev əmrləri hər servisin öz konfiqurasiyasındadır; bu sahələri kök səviyyədə əlavə etmə.

| Servis | Qovluq | Açıq yol |
| --- | --- | --- |
| `portal` | `.` | `/` və qalan portal ünvanları |
| `level-up` | `apps/level-up` | `/tools/level-up` və alt yollar |
| `overtimer` | `apps/overtimer` | `/tools/overtimer` və alt yollar |
| `sloth-ai` | `apps/sloth-ai` | `/tools/sloth-ai` və alt yollar |
| `visio-generator` | `apps/visio-generator` | `/tools/visio-generator` və alt yollar |
| `sprint-pointer` | `apps/sprint-pointer` | `/tools/sprint-pointer` və alt yollar |

Beş konkret tətbiq rewrite-ı əvvəl, `portal` üçün catch-all isə axırdadır. Yol prefiksi silinmir: məsələn `/tools/level-up/api/labs/http` eyni yolla Level Up-a çatır. Next.js `basePath` və brauzerdəki API/Worker ünvanları bu yollara uyğundur. SprintPointer üçün servis marşrutunun axtarış prefiksi çıxarılır, Vite isə asset və API ünvanlarını `/tools/sprint-pointer/` ilə yaradır. Express API həm ilkin, həm də funksiya rewrite ünvanlarını qəbul edir. Qısa `/level-up`, `/calendar`, `/todo`, `/sprint-pointer` kimi ünvanlar portalı və onun menyusunu açır.

Bu quruluşda altı servis də açıqdır; yalnız daxili servis yoxdur. Tətbiqlər bir-birinə server sorğusu etmir. Portalın `/api/health` funksiyası beş tətbiqi daxili binding-lərlə yoxlayır:

| Çağıran | Hədəf | Vercel-in yaratdığı dəyişən |
| --- | --- | --- |
| `portal` | `level-up` | `LEVEL_UP_URL` |
| `portal` | `overtimer` | `OVERTIMER_URL` |
| `portal` | `sloth-ai` | `SLOTH_AI_URL` |
| `portal` | `visio-generator` | `VISIO_GENERATOR_URL` |
| `portal` | `sprint-pointer` | `SPRINT_POINTER_URL` |

Bu dəyişənlərə özün dəyər vermə. Vercel onları yalnız servisin runtime funksiyasına daxil edir. Sağlamlıq yoxlaması onları hər sorğu zamanı oxuyur; build və middleware binding istifadə etmir. Dəyişən yoxdursa localhost və ya açıq domenə keçid edilmir, servis hazır deyil kimi göstərilir. Binding hədəfi açıq etmir; açıq yollar ayrıca rewrite-larla müəyyən olunur.

Rəsmi sənədlər: [Services](https://vercel.com/docs/services), [routing](https://vercel.com/docs/services/routing), [bindings](https://vercel.com/docs/services/bindings).

## Lokal iş və yoxlama

Node.js 24 və npm:

```sh
npm ci --include=dev
npm run setup
npx vercel dev --local
```

`vercel dev` bütün servisləri və binding-ləri birlikdə başladır. `--local` hesabla əlaqələndirmədən lokal yoxlama üçündür. Eyni əmr `npm run dev:services` ilə də mövcuddur. Bu script ayrıca adlanır: kök `dev` scriptinin `vercel dev` çağırması Vercel-in rekursiya qorumasına düşür. `npm run dev` yalnız portal üçün olan development əmridir; tam sayt üçün `dev:services` istifadə et.

```sh
npm test
npm run typecheck
npm run build
# vercel dev işləyərkən, ayrı terminalda:
npm run test:browser
npm run test:theme
```

Typecheck TypeScript tətbiqlərində işləyir; SprintPointer JavaScript tətbiqi unit test və Vite build ilə yoxlanır.

`build:portal` yalnız ortaq brauzer yoxlayıcılarını və portalı build edir. O, digər servislərin quraşdırılmasından asılı deyil. `npm run build` lokal yoxlama üçün portalı və beş tətbiqi ardıcıl build edir. Vercel hər servisi ayrıca build edir; əvvəlki müvəqqəti statik-export sistemi və əllə yazılmış funksiya adapterləri çıxarılıb.

Brauzer testləri `/usr/bin/chromium` istifadə edir. `CHROMIUM_PATH` və `PERASHKI_TEST_ORIGIN` ilə dəyişmək olar. Onlar ortaq menyunu, bir JSON-dan bütün məlumatların bərpasını, SprintPointer-i, Sloth AI Worker-lərini, Visio yaddaşını, Overtimer-i, Level Up SQL/API laboratoriyalarını və mobil görünüşü yoxlayır. Binding yoxlamaları URL-lərin runtime-dan oxunmasını və prefikslərin qorunmasını da test edir.

## Mənbələr

Orijinal tətbiqlərin kodu, sənədləri, testləri, bildirişləri və lockfile-ları `apps/` altında saxlanır. Mənbə commitləri [docs/sources.json](docs/sources.json) faylındadır. Mənbə repozitoriyalarına dəyişiklik göndərilməyib.

Tətbiqlərin API-ləri və testləri öz servis qovluqlarında saxlanır. Hər tətbiq öz lockfile-ı ilə quraşdırılır. Ortaq JSON yoxlayıcıları portal build-i zamanı mənbə parserlərindən hazırlanır; portalın öz Zod asılılığı ayrıca sabitlənib.

Təqvimin verilmiş bayram məlumatları və funksiyaları saxlanıb; görünüş vəziyyətinin ehtiyat nüsxəyə daxil edilməsi və ortaq tema əlavə olunub. Bayram məlumatlarına ayrıca məzmun yoxlaması aparılmayıb.
