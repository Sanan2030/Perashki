export const STORY_KEY = 'perashki:stories:v1';
export const POINTS = [1, 2, 3, 5, 8, 13];
const fold = value => value.toLocaleLowerCase('az').replace(/[əıçğöşü]/g, char => ({ ə: 'e', ı: 'i', ç: 'c', ğ: 'g', ö: 'o', ş: 's', ü: 'u' })[char]);
const patterns = [
  { match: /\bapi\b|inteqrasiya|webhook|integration/, name: 'İnteqrasiya', points: 5, criteria: ['Uğurlu cavab gözlənilən məlumatlarla emal edilir.', 'Timeout və uğursuz cavab istifadəçiyə aydın bildirilir; mövcud məlumatlar qorunur.', 'Təkrar sorğunun eyni əməliyyatı yenidən yaratmasının qarşısı alınır.'], technical: 'API müqaviləsini, status kodlarını, timeout və təkrar sorğu davranışını dəqiqləşdir. Sorğu və cavab üçün nümunələr əlavə et.' },
  { match: /login|giris|parol|qeydiyyat|autentifikasiya/, name: 'Giriş və hesab', points: 5, criteria: ['Düzgün məlumatlarla giriş uğurlu tamamlanır.', 'Yanlış və ya natamam məlumatlar üçün aydın xəta göstərilir.', 'İcazəsi olmayan istifadəçi qorunan məlumatlara daxil ola bilmir.'], technical: 'Sessiya müddətini, giriş cəhdlərinin məhdudlaşdırılmasını və hesab bərpası qaydasını mövcud sistemə uyğun dəqiqləşdir.' },
  { match: /ixrac|export|excel|csv|pdf|hesabat/, name: 'Hesabat və ixrac', points: 3, criteria: ['Seçilmiş filtrlərə uyğun məlumatlar nəticəyə daxil edilir.', 'Sütunlar, tarixlər və Azərbaycan hərfləri düzgün göstərilir.', 'Boş nəticə və böyük məlumat həcmi üçün davranış müəyyən edilir.'], technical: 'Fayl formatını, sütunları, filtrləri və maksimum həcmi razılaşdır. İxracın mənbədəki məlumatı dəyişmədiyini yoxla.' },
  { match: /idxal|import|upload|fayl/, name: 'Fayl idxalı', points: 5, criteria: ['Dəstəklənən fayl yoxlanıldıqdan sonra məlumatlar düzgün oxunur.', 'Yanlış format və yararsız məlumat mövcud qeydləri dəyişmir.', 'Təkrarlanan qeydlər və qismən uğursuzluq üçün nəticə aydın göstərilir.'], technical: 'Fayl sxemini, həcm həddini, təkrarların tanınmasını və səhv zamanı geri qaytarılmanı müəyyən et.' },
  { match: /axtar|search|filtr|filter/, name: 'Axtarış və filtrlər', points: 3, criteria: ['Axtarış və seçilmiş filtrlərə uyğun qeydlər göstərilir.', 'Bir neçə filtr birlikdə düzgün işləyir və təmizlənə bilir.', 'Nəticə tapılmadıqda aydın boş vəziyyət göstərilir.'], technical: 'Axtarılacaq sahələri, böyük/kiçik hərf qaydasını və böyük siyahıda səhifələməni dəqiqləşdir.' },
  { match: /bildiris|notification|email|mesaj/, name: 'Bildirişlər', points: 5, criteria: ['Müəyyən edilmiş hadisə baş verdikdə uyğun bildiriş hazırlanır.', 'Bildirişin alıcısı və məzmunu qaydalara uyğun seçilir.', 'Göndərilmə xətası və təkrar bildiriş üçün davranış yoxlanılır.'], technical: 'Hadisəni, alıcı qaydasını, kanalı və məzmun şablonunu razılaşdır. Çatdırılma nəticəsinin necə izlənəcəyini müəyyən et.' },
  { match: /sil|redakte|yarat|elave|deyis|delete|edit|create/, name: 'Məlumatların idarəsi', points: 3, criteria: ['İcazəsi olan istifadəçi tələb olunan əməliyyatı yerinə yetirir.', 'Məcburi sahələr və biznes qaydaları saxlamadan əvvəl yoxlanılır.', 'Əməliyyatın nəticəsi görünür; uğursuzluqda mövcud məlumat qorunur.'], technical: 'Sahələri, validasiyaları, icazələri və əlaqəli qeydlərə təsiri dəqiqləşdir.' },
];

export function generateStory({ title, context = '', role = 'istifadəçi', type = 'User Story' }) {
  title = title.trim(); context = context.trim(); role = role.trim() || 'istifadəçi';
  if (title.length < 5 || title.length > 300) throw new Error('Başlıq 5–300 simvol arasında olmalıdır.');
  if (context.length > 5000 || role.length > 150 || !['User Story', 'Task', 'Bug'].includes(type)) throw new Error('Daxil edilmiş məlumat uyğun deyil.');
  const pattern = patterns.find(pattern => pattern.match.test(fold(`${title} ${context}`))) || {
    name: 'Ümumi funksiya', points: 3,
    criteria: ['İstifadəçi təsvir edilən əsas axını uğurla tamamlayır.', 'Yanlış və natamam məlumat üçün aydın yoxlama mesajları göstərilir.', 'Nəticə yenidən açıldıqda gözlənilən vəziyyət qorunur.'],
    technical: 'Əsas ekranları, məlumat sahələrini, biznes qaydalarını və mövcud komponentlərdən istifadə imkanını dəqiqləşdir.',
  };
  const description = type === 'Bug'
    ? `Problem: ${title}\n\nGözlənilən davranış:\n${title} ilə bağlı axın razılaşdırılmış biznes qaydasına uyğun işləməlidir.\n\nFaktiki davranış və təkrar addımları:\n${context || 'Faktiki nəticəni, təkrar addımlarını və istifadə olunan mühiti əlavə et.'}`
    : type === 'Task'
      ? `Məqsəd: ${title}\n\nİşin həcmi:\n${context || `«${title}» işinin icrası üçün tələb olunan dəyişiklikləri hazırlamaq və yoxlamaq.`}`
      : `Bir ${role} olaraq, «${title}» imkanından istifadə etmək istəyirəm ki, əlaqəli işi sistem daxilində rahat və düzgün tamamlaya bilim.\n\nİşin həcmi:\n${context || `«${title}» üçün əsas istifadəçi axını, giriş məlumatları və nəticə hazırlanmalıdır.`}\n\nDəqiqləşdiriləcək biznes faydası:\nBu dəyişikliklə hansı nəticənin və ya göstəricinin yaxşılaşacağını məhsul sahibi ilə razılaşdır.`;
  return {
    id: crypto.randomUUID(), createdAt: new Date().toISOString(), title, context, role, type,
    category: pattern.name, points: type === 'Bug' ? 5 : pattern.points, description,
    acceptance: pattern.criteria.map((text, index) => `${index + 1}. ${text}`).join('\n'),
    technical: pattern.technical,
    assumptions: 'İşin sərhədləri və istisnaları hansılardır?\nHansı rolların icazəsi var?\nMövcud sistem və ya komandadan asılılıq varmı?\nTest məlumatı və qəbul üçün məsul şəxs kimdir?',
    estimateNote: `${pattern.name} üçün ilkin ${type === 'Bug' ? 5 : pattern.points} SP təklifi. Bu, başlıqdakı mövzuya əsaslanan yerli şablondur; işin həcmi, asılılıqlar və qeyri-müəyyənlik komanda ilə dəqiqləşdirilməlidir.`,
  };
}

export function validateStoryStore(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.stories) || value.stories.length > 200) throw new Error('StoryPointer məlumatı uyğun deyil.');
  if (value.inputs !== undefined) {
    if (!value.inputs || typeof value.inputs !== 'object') throw new Error('Story girişləri uyğun deyil.');
    for (const key of ['title', 'context', 'role', 'type']) if (typeof value.inputs[key] !== 'string' || value.inputs[key].length > (key === 'context' ? 5000 : key === 'title' ? 300 : 150)) throw new Error('Story giriş sahəsi uyğun deyil.');
    if (!['User Story', 'Task', 'Bug'].includes(value.inputs.type)) throw new Error('İş növü uyğun deyil.');
  }
  for (const story of [...value.stories, ...(value.draft ? [value.draft] : [])]) {
    if (!story || typeof story.id !== 'string' || !story.id || story.id.length > 100 || !Number.isFinite(Date.parse(story.createdAt)) || !POINTS.includes(story.points) || !['User Story', 'Task', 'Bug'].includes(story.type)) throw new Error('Story qeydi uyğun deyil.');
    for (const key of ['title', 'context', 'role', 'category', 'description', 'acceptance', 'technical', 'assumptions', 'estimateNote']) {
      if (typeof story[key] !== 'string' || story[key].length > (key === 'title' ? 300 : 20000)) throw new Error('Story sahələri uyğun deyil.');
    }
  }
  if (new Set(value.stories.map(story => story.id)).size !== value.stories.length) throw new Error('Story identifikatorları təkrarlanır.');
  return value;
}

export function storyMarkdown(story) {
  return `# ${story.title}\n\nWork Item Type: ${story.type}\nStory Points: ${story.points}\n\n## Description\n${story.description}\n\n## Acceptance Criteria\n${story.acceptance}\n\n## Technical Notes\n${story.technical}\n\n## Open Questions\n${story.assumptions}\n`;
}

export function storyHTML(story) {
  const escape = text => text.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  return `<h2>${escape(story.title)}</h2><p>Story Points: ${story.points}</p>${[['Description', story.description], ['Acceptance Criteria', story.acceptance], ['Technical Notes', story.technical], ['Open Questions', story.assumptions]].map(([heading, text]) => `<h3>${heading}</h3><p>${escape(text).replace(/\n/g, '<br>')}</p>`).join('')}`;
}
