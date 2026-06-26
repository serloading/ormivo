# Ormivo — Sistem Dokümantasyonu

> Bu dosya, projeyi hiç görmemiş bir yapay zekanın sıfırdan devam edebilmesi için hazırlanmıştır.  
> Son güncelleme: 2026-06-26

---

## 1. Proje Genel Bakış

**Ormivo**, lüks parfüm satışı yapan bir e-ticaret sitesidir. İki ana parçadan oluşur:

- **Site** (`/`) — Müşterilerin parfüm keşfettiği, sepete ekleyip sipariş verdiği vitrin
- **Admin Paneli** (`/admin`) — Siparişleri, ürünleri, müşterileri, finansı yöneten iç panel

**Canlı URL:** https://ormivo.vercel.app  
**GitHub:** https://github.com/serloading/ormivo  
**Deploy:** `git push origin main` → Vercel otomatik production deploy tetikler

---

## 2. Tech Stack

| Alan | Teknoloji |
|------|-----------|
| Framework | Next.js **16** (App Router, `"use server"`) |
| UI | React 19, Tailwind CSS |
| ORM | Prisma **7** (`@prisma/adapter-pg`) |
| Veritabanı | PostgreSQL (Supabase, Singapore bölgesi) |
| Kimlik Doğrulama | NextAuth (admin) + özel JWT (site kullanıcıları) |
| Dosya Yükleme | `/api/upload` endpoint (Vercel Blob) |
| Deploy | Vercel — git push → otomatik production |

### Kritik Next.js 16 Farkları
- `params` artık Promise: `const { slug } = await params;`
- `searchParams` artık Promise: `const sp = await searchParams;`
- Server Actions: `"use server"` dosya başında veya fonksiyon başında

### Prisma 7 Farkları
- Bağlantı `prisma.config.ts` dosyasında — `schema.prisma`'da `url` yok
- Schema değişikliği: `npx prisma db push` + `npx prisma generate`
- `prisma migrate dev` kullanma — shadow DB gerektirir, `db push` kullan

---

## 3. Klasör Yapısı

```
ormivo-site/
├── app/
│   ├── (admin)/admin/          # Admin panel sayfaları
│   │   ├── dashboard/          # Genel özet
│   │   ├── urunler/            # Ürün listesi + yeni + [id]/duzenle
│   │   ├── siparisler/         # Manuel siparişler (Order modeli)
│   │   ├── site-siparisler/    # Web siparişleri (SiteOrder modeli)
│   │   ├── musteriler/         # Müşteri CRM
│   │   ├── markalar/           # Marka yönetimi
│   │   ├── kategoriler/        # Kategori yönetimi
│   │   ├── stok/               # Stok takibi
│   │   ├── kargo/              # Kargo takibi
│   │   ├── rapor/              # Satış raporu + finans özeti
│   │   ├── borc-alacak/        # Borç/alacak takibi
│   │   ├── kuponlar/           # Kupon kodu yönetimi
│   │   └── finans/             # Gelir/gider kayıtları
│   ├── (site)/                 # Müşteri sitesi
│   │   ├── page.tsx            # Ana sayfa (ürün kataloğu)
│   │   ├── urunler/            # Ürün listesi + [slug] detay
│   │   ├── sepet/              # Sepet sayfası
│   │   ├── giris/              # Giriş yap
│   │   ├── kayit/              # Kayıt ol
│   │   ├── hesabim/            # Hesap yönetimi (profil, siparişler, favoriler)
│   │   └── siparis-tamamlandi/ # Sipariş onay sayfası
│   ├── api/
│   │   ├── upload/             # Dosya yükleme endpoint
│   │   ├── products/page/      # Ürün pagination API (infinite scroll için)
│   │   └── auth/               # NextAuth + logout
│   └── layout.tsx
├── components/
│   ├── admin/
│   │   ├── AdminSidebar.tsx
│   │   ├── AdminUrunlerClient.tsx   # Ürün listesi (inline edit, bulk, thumbnail)
│   │   ├── ProductForm.tsx          # Ürün ekle/düzenle formu
│   │   └── BorcAlacakClient.tsx
│   └── site/
│       ├── SiteHeader.tsx           # Header (desktop + mobil hamburger)
│       ├── BottomNav.tsx            # Mobil alt navigasyon
│       ├── ProductGrid.tsx          # Infinite scroll grid
│       ├── LoggedInCart.tsx         # Sepet (giriş yapmış)
│       ├── GuestCart.tsx            # Sepet (misafir)
│       ├── FavoriteButton.tsx       # Favori kalp butonu (sağ alt köşe)
│       └── HesabimSiparisler.tsx    # Hesabım sipariş listesi + WA butonu
├── lib/
│   ├── prisma.ts
│   ├── session.ts              # JWT: { userId, phone, name, segment }
│   ├── segment.ts              # Segment sistemi (BRONZE/SILVER/GOLD)
│   └── actions/
│       ├── product.ts
│       ├── order.ts            # Manuel sipariş
│       ├── order-site.ts       # Web sipariş (placeOrder)
│       ├── site-order-admin.ts # Admin web sipariş düzenleme
│       ├── customer.ts
│       ├── cart.ts
│       ├── debt.ts             # Borç/alacak + ödeme
│       ├── coupon.ts
│       ├── finance.ts
│       └── auth.ts             # Site kullanıcı auth + updateSiteUserProfile
└── prisma/
    ├── schema.prisma
    └── prisma.config.ts
```

---

## 4. Veritabanı Şeması

### Brand
```
id, name, slug (unique), logo?, products[], createdAt, updatedAt
```

### Category
```
id, name, slug (unique), description?, image?,
parentId? (self-relation), products[], createdAt, updatedAt
```
**Mevcut kategoriler:** Kadın (kadin), Erkek (erkek), Unisex (unisex), Özel Koleksiyon (ozel-koleksiyon)

### Product
```
id, productNo (PRD-0001 unique),
name, slug (unique), description?, scentNotes?,
price Decimal, comparePrice?, costPrice?, costPriceUsd?,
images String[],
categoryId? → Category   (birincil kategori FK)
extraCategoryIds String[] (ek kategori ID'leri — çoklu kategori için)
brandId? → Brand,
isActive Boolean, isOzelKoleksiyon Boolean, isBestSeller Boolean,
stock Int, deletedAt? (soft delete),
cartItems[], favorites[], createdAt, updatedAt
```
**Not:** `extraCategoryIds` site filtrelerinde OR mantığıyla kullanılır.

### SiteUser
```
id, phone (unique), name?, passwordHash,
segment? String  -- "BRONZE" | "SILVER" | "GOLD" | null
cart?, addresses[], siteOrders[], favorites[], createdAt
```

### Customer (admin B2B müşteri)
```
id, customerNo (MUS-0001),
name, phone?, email?, city?, address?, note?,
segment? String  -- "GOLD" | "SILVER" | "BRONZE" | null
tags String[]    -- ["B2B", "Toptan", "Sadık", "Kurumsal", "Sorunlu"]
orders[], debts[], createdAt, updatedAt
```
**Not:** `updateCustomerSegment` çağrısı SiteUser.segment'i de senkronize eder (telefon eşleşmesiyle).

### Order (manuel — admin girer)
```
id, orderNo (unique),
customerId? → Customer,
items Json  -- [{productId?, name, qty, price}]
total Decimal, shippingFee?,
status OrderStatus,          -- PENDING|CONFIRMED|SHIPPED|DELIVERED|CANCELLED
paymentStatus String,        -- "PENDING"|"PAID"|"FREE"
deliveryMethod String,       -- "CARGO"|"PICKUP"
note?, trackingNo?, cargoCompany?,
createdAt, updatedAt
```

### SiteOrder (web — müşteri siteden verir)
```
id, orderNo,
userId? → SiteUser,
recipientName?, recipientPhone?, addressLine?, city?, district?,
items Json, total Decimal, discount Decimal,
couponCode?,
status OrderStatus,
paymentStatus String,        -- "PENDING"|"PAID"|"FREE"
deliveryMethod String,       -- "CARGO"|"PICKUP"
trackingNo?, cargoCompany?, note?,
createdAt, updatedAt
```

### CustomerDebt + SupplierDebt
```
id, customerId/supplierName,
orderId? (hangi siparişe bağlı),
description, totalAmount, paidAmount,
status String  -- "BEKLIYOR"|"KISMI"|"ODENDI"
dueDate?, payments[], createdAt
```

### Coupon
```
id, code (unique, büyük harf),
discountType String  -- "PERCENT"|"FIXED"
discountValue Decimal, minOrderTotal?,
maxUses?, usedCount Int, isActive Boolean, expiresAt?, createdAt
```

### Finance
```
id, type FinanceType (INCOME|EXPENSE),
amount Decimal, description, category?, date, siteOrderId?, createdAt
```
**Not:** Raporda gelir/kargo direkt siparişlerden hesaplanır. Finance tablosu yalnızca "Ürün Maliyeti" için kullanılır.

### Favorite
```
id, userId → SiteUser, productId → Product, createdAt
@@unique([userId, productId])
```

---

## 5. Segment Fiyatlandırma Sistemi

`lib/segment.ts`:
```typescript
SEGMENT_DISCOUNTS = { BRONZE: 0.30, SILVER: 0.40, GOLD: 0.60 }
SEGMENT_LABELS    = { BRONZE: "Bronz Üye", SILVER: "Gümüş Üye", GOLD: "Altın Üye" }
SEGMENT_COLORS    = { BRONZE: "bg-amber-700 text-white", SILVER: "bg-slate-400 text-white", GOLD: "bg-yellow-500 text-white" }
getSegmentPrice(basePrice, segment) → indirimli fiyat | null
```

- Giriş yapmış kullanıcı segment'e sahipse: tüm ürün kartlarında özel fiyat + rozet gösterilir
- Diğer kullanıcılar normal fiyat görür
- Session'a `segment` eklendi: `{ userId, phone, name, segment }`
- Admin `updateCustomerSegment` → SiteUser.segment otomatik güncellenir

---

## 6. Admin Paneli

**Giriş:** `/admin` → NextAuth → `ADMIN_EMAIL=admin@ormivo.com`

### Ürünler Sayfası (`/admin/urunler`)
- **Thumbnail:** Ürün adı yanında 40×40 küçük resim (tıklayınca fotoğraf modalı)
- **Fotoğraf modalı:** Mevcut resimleri görme/silme + yeni yükleme (listeden çıkmadan)
- **Ürün adı:** Tıklayınca inline input ile düzenlenir
- **Slug:** Ad altındaki gri yazı tıklanınca inline düzenlenir
- **Sitede görüntüle:** Ad üzerinde hover → `↗` ikonu → yeni sekmede `/urunler/[slug]`
- **Inline edit alanları:** Satış fiyatı, Geliş fiyatı, Stok, Marka, Kategori (hücreye tıkla → Enter/blur kaydet)
- **Toplu seçim:** Her satırda checkbox, başlıkta "Tümünü Seç"
- **Toplu düzenleme bar:** Altta çıkar → alan seç (fiyat/stok/marka/kategori/durum) → değer gir → Uygula

### Ürün Düzenleme Sayfası (`/admin/urunler/[id]/duzenle`)
- **Çoklu Kategori:** Checkbox listesi — birden fazla seçilebilir
  - İlk seçilen = `categoryId` (birincil, "Ana" rozeti)
  - Diğerleri = `extraCategoryIds[]`
  - Sitenin filtrelerinde OR mantığıyla çalışır

### Rapor Sayfası (`/admin/rapor`)
- 6 özet kart: Orijinal Satış, İndirimli Satış, Gerçek Satış, Maliyet, Kargo (CARGO_FEE=200₺), Kâr
- Ay filtresi + kategori/marka filtresi
- Kargo deduplication: `orderId` bazlı (aynı siparişten birden fazla item gelse de 1 kez sayılır)
- Sadece `paymentStatus === "PAID" || "FREE"` olan siparişler dahil edilir

### Borç/Alacak (`/admin/borc-alacak`)
- `pendingB2BOrders`: `CustomerDebt.orderId` ile eşleşen siparişler — borç ödenmiş olsa bile tekrar görünmez
  - (Önceki bug: debt ODENDI olunca order pending listeye geri dönüyordu)
- `pendingSiteOrders`: aktif (ödenmemiş) borcu olan müşterilerin telefonu eşleşirse hariç tutulur
- Kısmi ödeme: `addCustomerPayment(debtId, amount)` → `paidAmount` artar
- Sipariş düzenlemeden ek ödeme: `existingDebt` varsa `addCustomerPayment`, yoksa `createCustomerDebt`

---

## 7. Site (Vitrin)

### Header (`SiteHeader.tsx`)
- **Desktop:** Logo | Kadın | Erkek | Özel Koleksiyon | Unisex | Markalar dropdown | Arama | Sepet | Kullanıcı dropdown
- **Mobil hamburger menü:** Kategori linkleri (Hesabım/Çıkış Yap/Giriş Yap linkleri **YOK** — BottomNav'da)

### BottomNav (`components/site/BottomNav.tsx`)
Mobil alt navigasyon — sıra:
```
Ana Sayfa | Favoriler | [Ara — merkez büyük buton] | Sepet | Hesabım
```
- Giriş yapılmamışken Hesabım → `/giris` yönlendirir

### Ana Sayfa (`/`)
- Filtre yokken üstte "En Çok Satanlar" bölümü (top 10)
- `seededShuffle()` ile günlük sabit ürün sırası
- URL parametreleri: `?kategori=`, `?marka=`, `?sirala=`, `?q=`
- Özel Koleksiyon filtresi: `?kategori=ozel-koleksiyon` → `isOzelKoleksiyon: true`

### Ürünler Sayfası (`/urunler`)
- Sonsuz kaydırma (infinite scroll): `ProductGrid` + `/api/products/page` route
- Kategori filtresi: `category.slug` VE `extraCategoryIds` OR sorgusu
- Marka isimleri: DB'den geldiği gibi — **hiçbir uppercase dönüşümü yok**

### Ürün Detay (`/urunler/[slug]`)
- Segment fiyatı gösterimi (giriş yapmış üyeye rozet + indirimli fiyat)
- "Bunları da Beğenebilirsiniz" → aynı kategori ürünleri
- `ProductTabs`: Açıklama | Koku Notaları | Kullanım
- Marka logosu varsa logo, yoksa marka adı metin olarak

### Hesabım (`/hesabim`)
- **Profil kartı:** İsim/telefon düzenleme + şifre değiştirme (`HesabimProfileForm`)
- **Segment rozeti:** Başlık yanında Bronze/Silver/Gold badge (varsa)
- **Özet kartlar (3 adet):**
  - Toplam Alışveriş: `sum(items[].price × qty)` tüm siparişlerden
  - Kazandığın İndirim: `totalOriginal - totalPaid` (gerçek fark)
  - Toplam Ödediğin: `sum(order.total)`
- **Siparişler:** Son 20 sipariş + "Özetimi Gönder" WhatsApp butonu
- **Adresler, Borçlar, Favoriler** bölümleri
- **Favoriler** (`#favoriler`): kalp ile eklenen ürünler, 5'li grid

### Sepet
- **Giriş yapmış:** `LoggedInCart` — kupon kodu, cross-sell önerisi
- **Misafir:** `GuestCart` — localStorage tabanlı
- **Cross-sell:** Sepette sadece kadın ürünleri varsa → erkek ürünleri %30 indirimli önerir (ve tersi)
- **Kupon:** `validateCoupon(code, total)` → indirim tutarı hesaplanır

---

## 8. Server Actions Özeti

### `lib/actions/product.ts`
```typescript
getProducts()          // images + extraCategoryIds dahil
createProduct(data)    // productNo otomatik (PRD-0001)
updateProduct(id, data) // partial — fiyat değişince log + costExpense rebuild
bulkUpdateProducts(ids[], data) // toplu güncelleme
updateProductImages(id, images[]) // fotoğraf güncelleme
toggleProductActive(id, isActive)
deleteProduct(id)      // soft delete (deletedAt)
ProductFormData tipi: { name, slug, description, scentNotes?, price, comparePrice?,
  costPrice?, costPriceUsd?, categoryId?, extraCategoryIds?, brandId?,
  stock, isActive, isOzelKoleksiyon?, isBestSeller?, images[] }
```

### `lib/actions/auth.ts`
```typescript
register(phone, password, name?)
login(phone, password)
updateSiteUserProfile({ name?, phone?, currentPassword?, newPassword? })
// Session: { userId, phone, name, segment }
```

### `lib/actions/customer.ts`
```typescript
createCustomer(data) // { success: true, id: customer.id } — id önemli!
updateCustomerSegment(id, segment) // SiteUser.segment de güncellenir
updateCustomerTags(id, tags[])
```

### `lib/actions/debt.ts`
```typescript
createCustomerDebt({ customerId, orderId?, description, totalAmount, initialPayment?, dueDate? })
addCustomerPayment({ debtId, amount, note? })
deleteCustomerDebt(id)
getDebtStats() // { totalReceivable, totalOwed, collectedMonth, overdue }
```

### `lib/actions/order-site.ts`
```typescript
placeOrder({ recipientName, recipientPhone, addressLine, city, district?,
  note?, guestItems?, saveAddress?, couponCode?, couponDiscount? })
```

### `lib/actions/site-order-admin.ts`
```typescript
updateOrderItems(id, source, items, total, note, extra?)
// extra: { customerId?, discount?, status?, deliveryMethod? }
// deliveryMethod kontrolü: !== undefined (falsy değil!)
updatePaymentStatus(orderId, paymentStatus)    // site order
updateManuelOrderPayment(orderId, paymentStatus) // manuel order
```

---

## 9. Önemli Teknik Notlar

### Sipariş Tipleri
- `Order` = Admin panelden el ile girilen (B2B/manuel)
- `SiteOrder` = Müşterinin siteden verdiği
- Her ikisinin `items` JSON: `[{productId?, name, qty, price}]`

### PaymentStatus
`"PENDING"` | `"PAID"` | `"FREE"`  
FREE = ücretsiz — gelire sayılmaz ama kargo gideri olabilir

### Kargo Maliyeti
`CARGO_FEE = 200₺` — `deliveryMethod === "CARGO"` olan her sipariş için raporda gider sayılır  
Deduplication: `orderId` bazlı Set (aynı sipariş birden fazla item'a sahipse tek sayılır)

### Marka İsimleri
**Hiçbir yerde uppercase dönüşümü yapılmaz.** DB'den geldiği gibi gösterilir.  
Etkilenen 9 dosya: ProductGrid, CartItemRow, GuestCart, LoggedInCart, page.tsx, urunler/page.tsx, urunler/[slug]/page.tsx, hesabim/page.tsx, urunler/[slug]/related.

### Çoklu Kategori (extraCategoryIds)
- `Product.categoryId` = birincil FK (backwards compat)
- `Product.extraCategoryIds String[]` = ek kategori ID'leri
- Site filtreleme: `OR [{ category.slug: k }, { extraCategoryIds: { has: catId } }]`
- Admin Düzenle sayfasında checkbox listesi — ilk seçilen "Ana" olur

### Soft Delete
Ürünler silinmez: `deletedAt` set edilir. Tüm sorgularda `where: { deletedAt: null }`.

### FavoriteButton
Konumu: kart görsel alanının **sağ altı** (`bottom-2 right-2`) — badge ile çakışmaması için.

### Borç-Alacak Mantığı
```
pendingB2BOrders: id NOT IN allDebtOrderIds  (ödenmiş dahil TÜM debt orderId'leri)
pendingSiteOrders: telefon NOT IN activeDebtPhones  (sadece ödenmemiş borçlar)
```
Sipariş bir kez borç kaydına bağlandıysa asla pending listesine geri dönmez.

---

## 10. Ortam Değişkenleri (`.env`)

```bash
DATABASE_URL=postgresql://...supabase.com:5432/postgres
NEXTAUTH_SECRET=...
JWT_SECRET=...                   # site kullanıcı oturumları
ADMIN_EMAIL=admin@ormivo.com
ADMIN_PASSWORD_HASH=...
BLOB_READ_WRITE_TOKEN=...        # görsel yükleme
```

---

## 11. Deploy

```bash
git add .
git commit -m "..."
git push origin main   # → Vercel otomatik production deploy
```

`.next` klasörü: development cache — güvenle silinebilir, build'de yeniden oluşur. Boyutu 1GB'ı geçebilir (Turbopack cache + optimize edilmiş görseller).

---

## 12. Yaygın Hatalar ve Çözümler

| Hata | Çözüm |
|------|-------|
| `prisma migrate dev` shadow DB hatası | `prisma db push` kullan |
| Schema değişikliği sonrası TS hataları | `npx prisma generate` çalıştır |
| PowerShell `git add app/(admin)/...` | Bash tool ile çalıştır (parantez sorunu) |
| `createCustomer` ID yok | `result.id` kullan (`result.success` değil) |
| Decimal değerler küsuratlı | `Math.round()` veya `Number()` ile dönüştür |
| `.next` 1GB+ boyut | `.next` klasörünü sil — `npm run dev`'de yeniden oluşur |

---

## 13. Renk Paleti & UI Kuralları

```
#2c1810  — koyu kahve (başlıklar, ana metin)
#8b6f5e  — orta kahve (etiketler, ikincil)
#f5f0eb  — bej (arka plan, hover)
#e8ddd6  — açık border
#b8a89e  — placeholder, pasif metin
#C4A882  — altın (site accent)
#1A1A1A  — site koyu metin
```

- Font: `Playfair Display` (serif) + `Inter` (sans) — `latin + latin-ext` subset
- Tailwind `uppercase` class: sadece UI label'lar ve başlıklar için — **marka/ürün isimlerine uygulanmaz**
- Yorum yazılmaz; iyi isimler yeterli
- Error handling: sadece sistem sınırlarında (API, DB) — iç fonksiyonlarda değil
