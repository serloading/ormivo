# Ormivo AI Handoff

Son güncelleme: 2026-06-30

Bu dosya, projede benden sonra gelecek yapay zekanın hızlıca bağlam alması için tutulur.
Amaç:
- Projenin mimarisini kısa ve doğru şekilde özetlemek
- Şu ana kadar yapılan işleri kayda geçirmek
- Kalan işleri açıkça listelemek
- Her yeni işlemden sonra burayı güncellemek için standart bir format sağlamak

---

## 1. Proje Özeti

Ormivo, lüks parfüm odaklı bir e-ticaret sitesidir.

İki ana yüzü vardır:
- Site tarafı: müşteri vitrini, sepet, sipariş, hesap, adresler, favoriler
- Admin tarafı: ürünler, müşteriler, siparişler, finans, borç/alacak, raporlar

Teknik omurga:
- Next.js 16 App Router
- React 19
- Tailwind CSS
- Prisma 7
- PostgreSQL

Kimlik yapısı:
- Admin paneli NextAuth ile korunur
- Site kullanıcıları özel JWT session ile tutulur

Veri tarafı:
- `SiteUser` site müşterisi
- `Customer` admin CRM kaydı
- `Address` kullanıcı adresleri
- `SiteOrder` web siparişi
- `Order` manuel/admin siparişi
- `Finance` gelir/gider
- `CustomerDebt` ve `SupplierDebt` borç/alacak takibi

---

## 2. Mimarinin İşleyişi

### 2.1 Kullanıcı kayıt ve oturum

- Kullanıcı `/kayit` sayfasında `Ad Soyad`, `Telefon`, `Şifre` ile kayıt olur.
- `lib/actions/auth.ts` içindeki `register()`:
  - `SiteUser` oluşturur
  - aynı telefonla `Customer` yoksa bir `Customer` kaydı da açar
  - session oluşturur
- `lib/session.ts` içindeki `getSession()`:
  - session JWT'yi doğrular
  - DB'den güncel `name` ve `segment` bilgisini tekrar okur
  - gerekiyorsa müşteri kaydından `name` ve `segment` backfill eder

### 2.2 Segment mantığı

- Segment fiyat indirimi `lib/segment.ts` üzerinden hesaplanır
- Ürün kartları ve sepet, kullanıcı segmentine göre fiyat gösterebilir
- Admin müşteri segmentini değiştirdiğinde:
  - `Customer.segment` güncellenir
  - aynı telefon numarasına sahip `SiteUser.segment` de senkronize edilir

### 2.3 Adres akışı

- Kullanıcı `/hesabim/adres-ekle` sayfasından yeni adres ekler
- İlk adres ekleniyorsa:
  - ad ve telefon session'dan otomatik doldurulur
  - müşteri isterse değiştirebilir
- İkinci ve sonraki adreslerde:
  - tüm alanlar manuel girilir
- Adres verisi `lib/actions/address.ts` ile `Address` tablosuna yazılır

### 2.4 Sipariş akışı

- Misafir kullanıcılar sepetten sipariş verirken `GuestCart` üzerinden checkout eder
- Giriş yapmış kullanıcılar `LoggedInCart` kullanır
- Adres seçimi:
  - kayıtlı adres seçilebilir
  - yeni adres girilebilir
- Sipariş oluşturma `lib/actions/order-site.ts` üzerinden yürür

### 2.5 CRM ve admin

- `Customer` ekranı müşteri iletişim, segment, etiket ve notlarını taşır
- Admin paneli müşteri kaydını, ürünleri, siparişleri ve finansı yönetir
- Müşteri profilinde segment badge, sipariş özeti ve adresler görünür

---

## 3. Şu Ana Kadar Yapılanlar

### 3.1 Eski kullanıcı segment sorunu

Yapılan iş:
- Eski site kullanıcılarının profil sayfalarında segment görünmemesi sorununu çözdüm
- `getSession()` artık `SiteUser` kaydı eksikse müşteri kaydından `name` ve `segment` backfill ediyor
- Aynı telefonla müşteri kaydı varsa senkron tekrar çalışıyor

Etkilenen dosyalar:
- `lib/session.ts`
- `lib/site-user-sync.ts`
- `lib/actions/customer.ts`
- `lib/actions/auth.ts`

### 3.2 Kayıt akışı

Yapılan iş:
- Kayıt formunda `Ad Soyad` alanı zorunlu hale geldi
- Yeni kayıt kullanıcı adıyla birlikte `SiteUser` ve gerekiyorsa `Customer` oluşturuyor
- Müşteri kaydı varsa segment de session'a taşınabiliyor

Etkilenen dosya:
- `lib/actions/auth.ts`

### 3.3 İlk adres davranışı

Yapılan iş:
- İlk adres eklenirken isim ve telefon session'dan otomatik doluyor
- Müşteri bu alanları elle değiştirebiliyor
- İkinci ve sonraki adreslerde tüm alanlar manuel kalıyor

Etkilenen dosyalar:
- `app/(site)/hesabim/adres-ekle/page.tsx`
- `app/(site)/hesabim/adres-ekle/AdresEkleForm.tsx`

### 3.4 Prisma delegate hatası

Yapılan iş:
- `app/(site)/hesabim/adres-ekle/page.tsx` içindeki `prisma.userAddress` hatası düzeltildi
- Doğru tablo `prisma.address`

---

## 4. Açık Kalan İşler

Bu bölüm, bir sonraki yapay zekanın öncelik sırasını görmesi için tutulur.

### 4.1 Veri backfill

Muhtemel ihtiyaç:
- DB'de zaten var olan eski `SiteUser` kayıtlarını topluca tarayıp
  - `name` boşsa müşteri kaydından doldurmak
  - `segment` boşsa müşteri kaydından doldurmak

Not:
- Şu an bunu session bazında ve kayıt akışında toparlıyoruz
- Ama toplu bir script, veri bütünlüğü için daha güvenli olur

### 4.2 Adres ve profil deneyimi

Muhtemel iyileştirmeler:
- İlk adres ekranında otomatik doldurulan alanlara küçük açıklama eklemek
- Profil kartında eski verilerin backfill edildiğini kullanıcıya daha net göstermek

### 4.3 Sistematik log kaydı

İstenilen davranış:
- Her önemli işlemden sonra bu dosyaya kısa kayıt düşülmeli
- Özellikle:
  - veri modeli değişiklikleri
  - kullanıcı akışı değişiklikleri
  - backend senkron davranışları
  - tamamlanan fix'ler

---

## 5. Kayıt Standardı

Bu repo üzerinde çalışan her yapay zeka, bir görev tamamlandığında bu dosyanın en altına yeni bir giriş eklemeli.

Önerilen format:

```md
## 2026-06-29 05:40

Yapılanlar:
- ...
- ...

Etkilenen dosyalar:
- `path/to/file.ts`
- `path/to/file.tsx`

Notlar:
- ...

Sonraki adım:
- ...
```

Kısa kurallar:
- Tarih ve saat ekle
- Ne yapıldığını 2-5 maddeyle yaz
- Dokunulan dosyaları belirt
- Eğer bir sonraki adım varsa ekle
- Kısa ve operasyonel yaz

### Token Sınırı Kuralı

Eğer görev sırasında token sınırı yaklaşırsa ya da oturum kapanmadan önce iş yarım kalacaksa, aşağıdaki iki şey zorunludur:

1. Bu dosyada ilgili bölüm güncellenir.
2. O ana kadar nerede kalındığı ve bir sonraki yapay zekanın ne yapması gerektiği açıkça yazılır.

Kayıt yapılmadan işi bırakma.

---

## 6. Son Kayıt

### 2026-06-29

Yapılanlar:
- Eski kullanıcıların segment ve isim backfill akışı eklendi
- Kayıt akışında ad zorunlu hale getirildi
- İlk adres için isim ve telefonun otomatik dolması desteklendi
- Adres sayfasındaki `userAddress` delegate hatası düzeltildi

Etkilenen dosyalar:
- `lib/site-user-sync.ts`
- `lib/session.ts`
- `lib/actions/customer.ts`
- `lib/actions/auth.ts`
- `app/(site)/hesabim/adres-ekle/page.tsx`

Sonraki adım:
- Gerekirse mevcut tüm eski `SiteUser` kayıtlarını toplu backfill eden bir script eklemek
- Gerekirse adres ve profil ekranlarında backfill bilgisini görsel olarak iyileştirmek

---

## 7. Devam Eden Çalışma Talimatı

Bu dosyayı okuyan sonraki yapay zeka için zorunlu akış:

1. Önce son kayıt satırını oku.
2. Hangi dosyalara dokunulduğunu gör.
3. Sonraki adımı, mevcut durumdan kopmadan devam ettir.
4. Eğer işlem tamamlanmadan token azalırsa, o anki ilerlemeyi bu dosyaya yaz.
5. Sonraki çalışmada kaldığın yerden devam et.

Özellikle şunlar mutlaka yazılmalı:
- Yapılan işin özeti
- Yarım kaldıysa hangi noktada kaldığı
- Sonraki yapılacaklar listesi
- Gerekirse risk veya bağımlılık notu

---

## 8. 2026-06-29 Katalog Import Hazırlığı

Yapılanlar:
- Kullanıcıdan gelen ürün listesi için toplu import scripti eklendi
- Script marka kayıtlarını yoksa oluşturuyor
- Script kategori ataması, fiyatlandırma, stok artışı, açıklama ve koku notu üretimi yapacak şekilde hazırlandı

Etkilenen dosyalar:
- `prisma/import-stock-list.mjs`

Şu anki durum:
- Script sözdizimi kontrolünden geçti
- Veritabanı bağlantısı sandbox içinde doğrudan çalıştırılamadı

Sonraki adım:
- Uygun izinle `prisma/import-stock-list.mjs` scriptini kullanıcı listesinden çalıştırmak
- Çalıştırma sonucu oluşan `created / updated / matched` sayılarını bu dosyaya yazmak
- Eğer eşleşmeyen kayıt kalırsa onları ayrıca not etmek

---

## 9. 2026-06-29 Katalog Import Tamamlandı

Yapılanlar:
- Kullanıcı listesindeki ürünler canlı veritabanına işlendi
- Eksik marka kayıtları script tarafından oluşturuldu
- Ürünler marka ve kategoriye göre eşleştirildi
- Fiyatlandırma kuralları uygulandı
- Stoklar güncellendi
- Açıklama ve koku notları üretildi

Sonuç:
- Parse edilen satır: 268
- Eşleşen / güncellenen ürün: 36
- Yeni oluşturulan ürün: 232
- Atlanan satır: 0

Not:
- İlk çalıştırmada `productNo` benzersiz çakışması oluştu
- Script, silinmiş ürünlerdeki `productNo` değerlerini de dikkate alacak şekilde düzeltildi ve yeniden çalıştırıldı

Etkilenen dosyalar:
- `prisma/import-stock-list.mjs`

Sonraki adım:
- İstenirse bu import için ayrı bir denetim raporu çıkarılabilir
- İstenirse kategori/marka eşlemelerinde özel ince ayar yapılabilir

---

## 10. 2026-06-29 Veritabanı Doğrulaması

Yapılanlar:
- Import sonrasında veritabanı salt-okuma kontrolü yapıldı
- Marka ve kategori listeleri kontrol edildi
- Toplam ürün sayısı doğrulandı

Sonuç:
- `PRODUCT_COUNT: 1233`
- Kategoriler mevcut ve aktif:
  - `Kadın Parfümleri`
  - `Erkek Parfümleri`
  - `Unisex`
  - `Özel Koleksiyon`
- Marka listesinde import edilen markalar görünür durumda

Etkilenen dosyalar:
- `AI_HANDOFF.md`

Sonraki adım:
- İstenirse tek tek örnek ürünlerin `brand / category / price / costPrice / stock` alanları da raporlanabilir

---

## 11. 2026-06-29 Import Denetimi ve Temizlik

Yapılanlar:
- Import sonrası örnek ürün audit'i çalıştırıldı
- Şüpheli eşleşmeler ayrı bir kontrol listesi olarak çıkarıldı
- Yanlışlıkla ürün olarak eklenen uzun talep cümlesi veritabanından silindi
- Import parser'a instruction/prose filtresi eklendi

Örnek doğrulama:
- `Zara White Orchid` -> `Kadın Parfümleri`, `3000 TL`, `650`, `10 stok`
- `Zara Wonder ROSE M` -> `Kadın Parfümleri`, `3000 TL`, `650`, `20 stok`
- `Zadig & Voltaire Freedom` -> `Unisex`, `3000 TL`, `650`, `10 stok`
- `Rhinoceros` -> `Zoologist`, `Erkek Parfümleri`, `3000 TL`, `650`, `10 stok`

Şüpheli / manuel kontrol önerilen örnekler:
- `Atkinson Fashion Decre`
- `BAD BOY Sparling ICE`
- `Chole L'eau DE Lumineuse`
- `MISS Chery EDP`
- `ZETN`
- `Metics`
- `Velvet Orchid Luminene`
- `LE VIE DI Milano Ivicoli`
- `Valentinio Ivory W`

Temizlik:
- Yanlışlıkla oluşan uzun talep cümlesi ürünü kaldırıldı
- `prisma/import-stock-list.mjs` içine benzer cümleleri filtreleyen güvenlik kuralı eklendi

Etkilenen dosyalar:
- `AI_HANDOFF.md`
- `prisma/audit-import.mjs`
- `prisma/cleanup-import.mjs`
- `prisma/import-stock-list.mjs`

Sonraki adım:
- Deploy öncesi mevcut değişiklikleri commit edip `origin/main` üzerine pushlamak

---

## 12. 2026-06-29 Deploy Tamamlandı

Yapılanlar:
- Deploy kapsamındaki değişiklikler commit edildi
- Commit `4df468d` olarak `origin/main` üzerine pushlandı
- Bu push ile production deploy tetiklendi

Notlar:
- Import parser, instruction/prose satırlarını filtreleyecek şekilde sertleştirildi
- Yanlışlıkla oluşan uzun talep cümlesi ürünü veritabanından kaldırıldı
- Handoff dokümanı son durumu ve denetim notlarını içeriyor

Etkilenen dosyalar:
- `AI_HANDOFF.md`

Sonraki adım:
- Deploy tamamlanma durumunu Vercel tarafında izlemek

---

## 13. 2026-06-29 Sipariş, Login ve UI Düzeltmeleri

Yapılanlar:
- Manuel sipariş kalemleri için ortak normalize katmanı eklendi
- Admin sipariş listesi, detay, rapor ve tamamlandı ekranları `name/qty` ile `productName/quantity` farkını tolere edecek hale getirildi
- Site tarafında sahte indirim görünümü azaltıldı ve brand tıklamaları ürün listesine yönlendirildi
- Telefon numarası canonical hale getirilerek kayıt/login ve müşteri senkron akışı güçlendirildi

Etkilenen dosyalar:
- `lib/order-items.ts`
- `lib/phone.ts`
- `lib/actions/auth.ts`
- `lib/actions/customer.ts`
- `lib/site-user-sync.ts`
- `lib/actions/site-order-admin.ts`
- `app/(admin)/admin/siparisler/page.tsx`
- `app/(admin)/admin/siparisler/detay/page.tsx`
- `app/(admin)/admin/rapor/page.tsx`
- `app/(site)/page.tsx`
- `app/(site)/urunler/page.tsx`
- `app/(site)/urunler/[slug]/page.tsx`
- `app/(site)/markalar/page.tsx`
- `components/site/ProductCard.tsx`
- `components/site/ProductGrid.tsx`
- `components/site/GuestCart.tsx`
- `components/site/LoggedInCart.tsx`
- `components/site/CartItemRow.tsx`

Notlar:
- `siteUser` lookup kısmında yanlış `findUnique` kullanımı düzeltiliyor
- `comparePrice` tabanlı fake indirim gösterimi kademeli olarak kaldırılıyor
- Mevcut eski kayıtlar için ek veri backfill scripti gerekirse ayrıca eklenebilir

Sonraki adım:
- `npm run build` ile derleme kontrolü yapmak
- Derlemede çıkan varsa kalan tip/hata noktalarını düzeltmek
- Gerekirse telefon ve sipariş backfill scripti eklemek

---

## 14. 2026-06-29 Build Doğrulaması Tamamlandı

Yapılanlar:
- Google font bağımlılığı kaldırıldı ve yerel font stack ile değiştirildi
- `LoggedInCart` içindeki brand link tipi hatası düzeltildi
- Proje derlemesi başarıyla tamamlandı

Sonuç:
- `npm run build` başarılı
- TypeScript kontrolü geçti
- Static page generation tamamlandı

Etkilenen dosyalar:
- `app/layout.tsx`
- `components/site/LoggedInCart.tsx`

Sonraki adım:
- İstenirse değişiklikler commitlenip deploy edilebilir
- Eski telefon formatları için toplu backfill scripti ayrıca çıkarılabilir

---

## 15. 2026-06-29 Depo Siparişi Genişletmeleri

Yapılanlar:
- Depo siparişlerine `depoName`, `depoPhone` ve elle girilebilir `shippingFee` alanları eklendi
- Depo siparişleri düzenlenebilir hale getirildi
- `Depoya İlet` butonu depo telefonuna göre WhatsApp mesajı açacak şekilde bağlandı
- Depo kargo gideri finans kaydına da yazılıyor, böylece toplam giderde görünür oldu
- Sipariş özeti ekranında ana tutar, alınan indirim ve son ödenecek tutar ayrı gösterildi
- Misafir sipariş submit akışı `finally` ile güvene alındı

Etkilenen dosyalar:
- `components/admin/DepoSiparisClient.tsx`
- `lib/actions/depo-siparis.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20260629070000_add_depo_shipping_and_links/migration.sql`
- `components/site/GuestCart.tsx`
- `app/(site)/hesabim/HesabimSiparisler.tsx`
- `lib/actions/order-site.ts`

Notlar:
- Prisma client yeniden üretildi
- `npm run build` başarılı

Sonraki adım:
- Deploy öncesi migration’ın canlı veritabanına uygulanması
- İstenirse logged-in checkout için de aynı submit güvenliği eklenebilir

---

## 16. 2026-06-29 Manuel Siparişten Depoya Aktarım

Yapılanlar:
- Elle girilen sipariş formuna `Siparişi kaydettikten sonra depoya da ekle` seçeneği eklendi
- Sipariş detay modaline ayrıca `Depoya Aktar` butonu eklendi
- Depo aktarımı en son açık bekleyen depo siparişini bulup ona ürünleri ekleyecek şekilde bağlandı
- Açık depo siparişi yoksa otomatik yeni bir bekleyen depo siparişi oluşturuluyor
- Kaynak sipariş numarası ve müşteri adı depo siparişi notlarına ekleniyor

Etkilenen dosyalar:
- `components/admin/SiparislerClient.tsx`
- `lib/actions/depo-siparis.ts`

Notlar:
- Depo aktarım akışı build kontrolünden geçti
- Aynı ürünler açık depo siparişine eklenirken adetler birleştiriliyor

Sonraki adım:
- İstenirse depo aktarımı için görünür bir başarı bildirimi/toast eklenebilir
- İstenirse açık depo siparişini kapatma/temizleme akışı ayrıca tasarlanabilir

---

## 17. 2026-06-29 Diamond Segmenti

Yapılanlar:
- `DIAMOND` segmenti hem kullanıcı segment listesine hem de site fiyat hesap sistemine eklendi
- Diamond için sabit tutar mantığı getirildi: ürün maliyetinin üstüne varsayılan `500 ₺` ekleniyor
- Admin segment ayar kartına Diamond için ayrı bir sabit tutar alanı eklendi
- Site ürün listesi, ürün detayı ve sepet ekranları Diamond ayarını server-side okuyacak şekilde güncellendi
- Müşteri listesi ve segment etiketleri Diamond’ı gösterecek şekilde genişletildi

Etkilenen dosyalar:
- `lib/segment.ts`
- `lib/customer-constants.ts`
- `lib/actions/settings.ts`
- `app/(admin)/admin/kuponlar/KuponlarClient.tsx`
- `app/(site)/page.tsx`
- `app/(site)/urunler/page.tsx`
- `app/(site)/urunler/[slug]/page.tsx`
- `app/(site)/sepet/page.tsx`
- `components/site/ProductGrid.tsx`
- `components/site/LoggedInCart.tsx`
- `components/site/CartItemRow.tsx`
- `components/admin/MusterilerClient.tsx`

Notlar:
- Diamond ayarı admin panelden elle değiştirilebilir
- `npm run build` başarılı

Sonraki adım:
- İstenirse Diamond segmenti için admin müşteri profil kartına özel ikon da eklenebilir
- İstenirse mevcut kullanıcıların segment backfill listesi de Diamond’ı destekleyecek şekilde ayrıca kontrol edilebilir

---

## 18. 2026-06-29 Sepet Kontrolü ve Deploy Hazırlığı

Yapılanlar:
- Logged-in sepet görünümü kontrol edildi
- Sepette ürün satırlarında segment fiyatı, özet panelinde ana tutar, segment indirimi ve son toplamın göründüğü doğrulandı
- Misafir sepette segment fiyatı yerine normal fiyat + kupon akışı korunuyor
- Canlıya çıkış için commit/push hazırlığı yapılıyor

Notlar:
- Build kontrolü daha önce başarılıydı
- Diamond fiyatı ve segment ayarları sepet ekranına da taşındı

Sonraki adım:
- Değişiklikleri commit edip `origin/main` üzerine pushlamak
- Push sonrası canlı ortamı doğrulamak

---

## 19. 2026-06-29 Canlıya Çıkış Tamamlandı

Yapılanlar:
- Sepet tarafı tekrar kontrol edildi ve indirimli fiyat, ana tutar ve son tutar özet akışının yerinde olduğu doğrulandı
- Gerekli değişiklikler `main` dalına commit edildi
- Değişiklikler uzak depoya pushlandı

Durum:
- Commit: `eb3ba20`
- Push: tamam
- Bekleyen işler: canlı ortamda son elle doğrulama

Sonraki adım:
- Canlı site açılıp sepet ve sipariş akışı son kez gözlemlenmeli
- Eğer deploy otomatik tetiklenmediyse platform tarafındaki deploy adımı da kontrol edilmeli

---

## 20. 2026-06-29 Sipari� D�zenleme ve Depo D�zenleme Dayan�kl�l�k Fixi

Yap�lanlar:
- Admin sipari� ekran�nda `order.items` verisi g�venli normalize edilecek �ekilde g�ncellendi
- Sipari� listesi, �zet modal� ve d�zenleme modal� art�k eski/kirli item verilerinde `NaN` �retmemek i�in ayn� normalize helper'� kullan�yor
- Depo sipari�i finans ve tedarik�i senkronizasyonu `findFirst` + `updateMany/create` modeline �evrildi
- B�ylece canl� veritaban�nda unique/migration fark� olsa bile depo sipari�i d�zenleme ak��� daha dayan�kl� hale geldi

Do�rulama:
- `npm run build` ba�ar�l�

Sonraki ad�m:
- Canl�da sipari� sat�rlar�n�n ve `D�zenle` modal�n�n tekrar kontrol edilmesi
- Depo sipari�i d�zenleme ekran�nda kargo/tedarik�i senkronizasyonunun test edilmesi

---

## 21. 2026-06-29 Son ��lem ve Kalan ��

Son yap�lan i�lem:
- Admin sipari� ekran�ndaki `order.items` verisi normalize edilerek `NaN` �retme riskleri azalt�ld�
- Depo sipari�i finans ve tedarik�i senkronizasyonu daha toleransl� hale getirildi
- Depo ekran�na tedarik�i borcu ekleme alan� ta��nmaya ba�land�
- `npm run build` ba�ar�l� oldu

Kalan i�lem:
- Depo ekran�ndaki tedarik�i borcu modal�n�n son g�r�n�m ve metin d�zeltmeleri varsa tamamlanmal�
- Git commit/push i�lemi, gerekirse index kilidi nedeniyle yeniden denenmeli
- Canl� ortamda sipari� d�zenleme ve depo sipari� d�zenleme ak��lar� tekrar denenmeli

Check edilmeli olan son tasklar:
- Sipari� d�zenleme hatas�: �r�nler `NaN` g�r�nmemeli ve `D�zenle` modal� a��lmal�
- Depo sipari� hatas�: d�zenleme ve tedarik�i/finans senkronizasyonu �al��mal�
- Tedarik�i ekleme alan� depo ekran�nda g�r�nmeli
- Canl� deploy sonras� son kontrol yap�lmal�

---

## 22. 2026-06-30 Tam Deploy

Yapılanlar (bu session):
- DepoSiparisClient.tsx: tüm garbled Turkish chars düzeltildi (â‚º→₺, Ã—→×, ÃœrÃ¼n→Ürün, SipariÅŸ→Sipariş, HazÄ±rlanÄ±yor→Hazırlanıyor vb.)
- DepoSiparisClient.tsx: Tedarikçi Borcu modal JSX'e eklendi (state/handler vardı ama modal render edilmiyordu)
- AdminUrunlerClient.tsx: "Geliş ₺" kolonu kaldırıldı, sadece "Geliş $" gösteriliyor (önceki session commit edilmişti)
- Diamond segmenti: costPrice + 500₺ baz alıyor (salePrice değil)
- Admin müşteri profili: şehir/ilçe dropdown ile adres ekleme (hesabım ile uyumlu)
- Siparişler ekranı: "Depoya Ekle" butonu her sipariş satırında

Commit: e8b7c8e → origin/main push edildi → Vercel deploy tetiklendi

Kalan/dikkat edilmeli:
- Production DB migration durumu: migrate deploy önceki sessionda çalıştırıldı, yeni migration yok
- "Geliş ₺" admin listede artık görünmemeli; hâlâ görülüyorsa browser hard refresh (Ctrl+Shift+R)
