# Mənbə tətbiqlərinin yenilənməsi

`docs/sources.json` hər tətbiqin son gətirilmiş mənbə commit-ini saxlayır. `npm run sync:app` həmin commit ilə mənbənin indiki `main` commit-i arasındakı fərqi gətirir. Bütöv tətbiq qovluğunu əvəz etmir: üçtərəfli Git merge yerli tema və inteqrasiya dəyişikliklərini nəzərə alır. Orijinal gətirilmə commit-i ilk yeniləmədə `importCommit` sahəsində də saxlanır.

## GitHub üzərindən

1. Mənbə repozitoriyasında, məsələn `Sanan2030/SlothAI`, dəyişiklikləri `main`-ə push et.
2. `Sanan2030/Perashki` daxilində **Actions → Sync imported app → Run workflow** aç.
3. `sloth-ai`, `visio-generator`, `overtimer` və ya `level-up` seç.
4. Yeni commit yoxdursa workflow heç nə dəyişmir. Yenilik varsa ayrıca budaqda birləşdirir və bütün iş məkanı üzrə unit testləri, typecheck və production build işlədir.
5. Yoxlamalar uğurlu olduqda açılan PR-ni nəzərdən keçir və `main`-ə merge et. Vercel Git inteqrasiyası aktivdirsə yeni `main` commit-i deployment başladır.

GitHub Actions üçün repozitoriyanın **Settings → Actions → General → Workflow permissions → Allow GitHub Actions to create and approve pull requests** seçimi açıq olmalıdır. Workflow yalnız PR yaradır; PR təsdiqləmir və avtomatik merge etmir. Konfiqurasiya üçün əlavə secret lazım deyil; cari repozitoriyanın `GITHUB_TOKEN`-i istifadə olunur. Mənbə repoları açıqdır.

Konflikt və ya test/build xətası olarsa workflow dayanır. Əsas `main` dəyişmir. Konflikti lokal variantla həll etmək olar; icra jurnalında Git-in göstərdiyi səbəb görünür.

## Lokal variant və konfliktin həlli

Əvvəlcə hazırkı dəyişiklikləri commit et. Sonra:

```sh
npm run sync:app -- sloth-ai --check
npm run sync:app -- sloth-ai
```

Birinci əmr yeni commit və fayl fərqlərini göstərir. İkinci əmr `sync/sloth-ai/...` budağı və `.local/sync/...` altında ayrıca Git worktree yaradır. Əmr nəticədə tam qovluq yolunu yazır. Həmin qovluğa keç, `git status` və `git diff --cached` ilə dəyişikliklərə bax. Konflikt varsa fayllardakı `<<<<<<<`, `=======`, `>>>>>>>` bloklarını həll edib `git add` et. Git bütün konfliktlər həll olunana qədər commit etməyə icazə vermir.

Göstərilən iş qovluğunda:

```sh
npm ci --include=dev
npm run setup
npm test
npm run typecheck
npm run build
git add --all
git commit -m "Update Sloth AI from upstream main"
git push -u origin HEAD
```

GitHub-da bu budaqdan `main`-ə PR açıb merge et. Lokal əmr özü commit, push və deploy etmir. `docs/sources.json` yenilənmiş commit-i mənbə dəyişiklikləri ilə birlikdə həmin budağa hazırlayır. Növbəti yeniləmə artıq bu commit-dən hesablanır.

Mənbədə force push/rebase nəticəsində əvvəlki commit yeni tarixçənin əcdadı deyilsə avtomatik yeniləmə dayandırılır. Bu halda mənbə tarixçəsi ayrıca yoxlanmalıdır.

Təqvim yüklənmiş HTML-dən, to-do və StoryPointer isə bu repozitoriyada hazırlanıb. Onların ayrıca mənbə sinxronizasiyası yoxdur.
