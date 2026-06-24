# Ormivo — Sistem Dokümantasyonu

> Bu dosya, projeyi hiç görmemiş bir yapay zekanın sıfırdan devam edebilmesi için hazırlanmıştır.  
> Son güncelleme: 2026-06-25

---

## 1. Proje Genel Bakış

**Ormivo**, lüks parfüm satışı yapan bir e-ticaret sitesidir. İki ana parçadan oluşur:

- **Site** (`/`) — Müşterilerin parfüm keşfettiği, sepete ekleyip sipariş verdiği vitrin
- **Admin Paneli** (`/admin`) — Siparişleri, ürünleri, müşterileri, finansı yöneten iç panel

**Canlı URL:** https://ormivo.vercel.app  
**GitHub:** https://github.com/serloading/ormivo  
**Deploy:** Vercel (production) — `vercel --prod --yes` komutu ile  
**Git push sadece Preview'a gider**, production için CLI gerekir.

---

## 2. Tech Stack

| Alan | Teknoloji |
|------|-----------|
| Framework | Next.js **16.2.9** (App Router, `"use server"`) |
| UI | React 19.2.4, Tailwind CSS |
| ORM | Prisma **7.8.0** (`@prisma/adapter-pg`) |
| Veritabanı | PostgreSQL (Supabase, Singapore bölgesi) |
| Kimlik Doğrulama | NextAuth (admin) + özel JWT (site kullanıcıları) |
| Dosya Yükleme | `/api/upload` endpoint (Vercel Blob veya benzeri) |
| Deploy | Vercel free plan — **100 deploy/gün limiti var** |

### Kritik Next.js 16 Farkları
- Server Actions: `"use server"` dosya başında veya fonksiyon başında
- `params` artık Promise: `const { slug } = await params;`
- `searchParams` artık Promise: `const sp = await searchParams;`
- Metadata `generateMetadata` async olabilir

### Prisma 7 Farkları
- `prisma.config.ts` dosyası kullanılıyor (eskisi değil)
- `prisma db push` schema değişikliklerini doğrudan uygular
- `prisma migrate dev` shadow DB gerektirir — bazı sürümlerde hata verebilir, `db push` kullan
- `prisma generate` sonrası Prisma client yenilenir

---

## 3. Klasör Yapısı

```
ormivo-site/
├── app/
│   ├── (admin)/admin/          # Admin panel sayfaları
│   │   ├── dashboard/          # Genel özet
│   │   ├── urunler/            # Ürün listesi + yeni + düzenle
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
│   │   ├── urunler/[slug]/     # Ürün detay sayfası
│   │   ├── sepet/              # Sepet sayfası
│   │   ├── giris/              # Giriş yap
│   │   ├── kayit/              # Kayıt ol
│   │   ├── hesabim/            # Hesap yönetimi
│   │   └── siparis-tamamlandi/ # Sipariş onay sayfası
│   ├── api/
│   │   ├── upload/             # Dosya yükleme endpoint
│   │   ├── products/           # Ürün pagination API
│   │   └── auth/               # NextAuth + logout
│   └── layout.tsx              # Root layout (fontlar, SessionProvider)
├── components/
│   ├── admin/
│   │   ├── AdminSidebar.tsx    # Admin sol menü
│   │   ├── ProductForm.tsx     # Ürün ekleme/düzenleme formu
│   │   ├── MusterilerClient.tsx # Müşteri listesi + CRM
│   │   └── ...
│   └── site/
│       ├── SiteHeader.tsx      # Site header (nav, arama, kullanıcı)
│       ├── SiteFooter.tsx      # Footer
│       ├── LoggedInCart.tsx    # Sepet (giriş yapmış)
│       ├── GuestCart.tsx       # Sepet (misafir)
│       ├── ProductTabs.tsx     # Ürün detay sekmeleri
│       ├── ProductGrid.tsx     # Ürün grid + infinite scroll
│       ├── HomeFilterClient.tsx # Mobil filtre
│       └── ...
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   ├── session.ts              # Site JWT session helper
│   └── actions/                # Server Actions
│       ├── product.ts
│       ├── order.ts            # Manuel sipariş actions
│       ├── order-site.ts       # Web sipariş (placeOrder)
│       ├── site-order-admin.ts # Admin web sipariş düzenleme
│       ├── customer.ts
│       ├── cart.ts
│       ├── coupon.ts
│       ├── finance.ts
│       ├── debt.ts
│       └── ...
└── prisma/
    ├── schema.prisma           # Veritabanı şeması
    └── prisma.config.ts        # Prisma yapılandırması
```

---

## 4. Veritabanı Şeması (Tüm Modeller)

### Brand
```prisma
model Brand {
  id, name, slug (unique), logo?, products[], createdAt, updatedAt
}
```

### Category
```prisma
model Category {
  id, name, slug (unique), description?, image?,
  parentId?, parent/children (self-relation),
  products[], createdAt, updatedAt
}
```
**Mevcut kategoriler:** Kadın, Erkek, Unisex (slug: kadin, erkek, unisex)

### Product
```prisma
model Product {
  id, productNo (PRD-0001 formatı, unique),
  name, slug (unique), description?,
  scentNotes?,          -- Koku notaları (yeni eklendi)
  price Decimal(10,2),
  comparePrice?, costPrice?, costPriceUsd?,
  images String[],
  categoryId?, brandId?,
  isActive Boolean, isOzelKoleksiyon Boolean,
  stock Int,
  deletedAt?,           -- Soft delete
  cartItems[], createdAt, updatedAt
}
```

### Customer (admin müşteri)
```prisma
model Customer {
  id, customerNo (MUS-0001 formatı),
  name, phone?, email?, city?, address?, note?,
  segment?,   -- "GOLD" | "SILVER" | "BRONZE" | null
  tags []=,   -- ["B2B", "Toptan", "Sadık", "Kurumsal", "Sorunlu"]
  orders[], siteOrders[], cargos[], debts[], notes[],
  createdAt, updatedAt
}
```

### Order (Manuel sipariş — admin tarafından girilir)
```prisma
model Order {
  id, orderNo (unique),
  customerId? → Customer,
  items Json,           -- [{productId, name, qty, price}]
  total Decimal(10,2),
  shippingFee?,
  status OrderStatus,   -- PENDING|CONFIRMED|SHIPPED|DELIVERED|CANCELLED
  paymentStatus String, -- "PENDING"|"PAID"|"FREE"
  deliveryMethod String,-- "CARGO"|"PICKUP"
  note?,
  cargo CargoTracking?,
  createdAt, updatedAt
}
```

### SiteOrder (Web siparişi — müşteri siteden verir)
```prisma
model SiteOrder {
  id, orderNo (unique, default cuid),
  status OrderStatus,
  userId? → SiteUser,
  addressId? → Address,
  recipientName?, recipientPhone?,
  addressLine?, city?, district?,
  items Json,           -- [{productId, name, qty, price}]
  total Decimal(10,2),
  customerId? → Customer,
  trackingNo?, cargoCompany?,
  note?,
  paymentStatus String, -- "PENDING"|"PAID"|"FREE"
  deliveryMethod String,-- "CARGO"|"PICKUP"
  discount Decimal,     -- iskonto tutarı
  couponCode?,          -- uygulanan kupon kodu
  createdAt, updatedAt
}
```

### SiteUser (Site müşteri hesabı)
```prisma
model SiteUser {
  id, phone (unique), name?, passwordHash,
  cart?, addresses[], siteOrders[], createdAt
}
```

### CartItem
```prisma
model CartItem {
  id, cartId → Cart, productId → Product,
  quantity Int,
  customPrice Decimal?,  -- Cross-sell indirimli fiyat için (yeni)
  addedAt,
  @@unique([cartId, productId])
}
```

### Coupon (Yeni eklendi)
```prisma
model Coupon {
  id, code (unique, büyük harf),
  discountType String,  -- "PERCENT" | "FIXED"
  discountValue Decimal,
  minOrderTotal?,
  maxUses?,
  usedCount Int,
  isActive Boolean,
  expiresAt?,
  createdAt
}
```

### Finance (Gelir/gider)
```prisma
model Finance {
  id, type FinanceType (INCOME|EXPENSE),
  amount Decimal, description, category?,
  date, createdAt, siteOrderId?
}
```
**Not:** Rapor sayfasında gelir ve kargo giderleri Finance tablosundan değil, doğrudan siparişlerden hesaplanır. Finance tablosu sadece "Ürün Maliyeti" kategorisi için kullanılır.

### CustomerDebt + SupplierDebt
Borç/alacak takibi için. Her ikisi de ödeme geçmişi tutar.

---

## 5. Admin Paneli

**Giriş:** `/admin` → NextAuth ile → `ADMIN_EMAIL=admin@ormivo.com`

### Sayfalar ve İşlevleri

| Sayfa | Route | Açıklama |
|-------|-------|----------|
| Dashboard | `/admin/dashboard` | Özet istatistikler |
| Ürünler | `/admin/urunler` | Liste, yeni ekle, düzenle, soft delete |
| Siparişler | `/admin/siparisler` | Manuel siparişler (Order modeli) |
| Web Siparişleri | `/admin/site-siparisler` | Siteden gelen siparişler (SiteOrder) |
| Müşteriler | `/admin/musteriler` | CRM: segment, etiket, notlar, borç |
| Markalar | `/admin/markalar` | Marka CRUD |
| Kategoriler | `/admin/kategoriler` | Kategori CRUD |
| Stok | `/admin/stok` | Stok güncelleme |
| Kargo | `/admin/kargo` | Kargo takip numarası girişi |
| Rapor | `/admin/rapor` | Satış geliri, kargo gideri, top ürünler, top müşteriler |
| Borç/Alacak | `/admin/borc-alacak` | CustomerDebt + SupplierDebt takibi |
| Kuponlar | `/admin/kuponlar` | Kupon kodu oluşturma/yönetme |

### Sidebar Yapısı (AdminSidebar.tsx)
```
Ürün Yönetimi: Ürünler, Stok
Sipariş Yönetimi: Siparişler, Web Siparişleri, Kargo
Müşteri Yönetimi: Müşteriler
Katalog: Markalar, Kategoriler
Finans Yönetimi: Rapor, Borç/Alacak, Kupon Kodları
```

### Sipariş Düzenleme (EditOrderModal) — Önemli Notlar
- `useManualTotal` checkbox yoktur — toplam her zaman direkt düzenlenebilir input
- Ürün satırları değişince toplam otomatik güncellenir (useEffect ile)
- Manuel override yapılırsa "↺ Otomatik hesapla" butonu çıkar
- Her ürün satırında "Listede yoksa yeni ürün ekle" butonu var
- Categories ve brands prop olarak üstten geçilmeli
- `updateOrderItems(id, source, items, total, note, extra)` action'ı kullanılır

---

## 6. Site (Vitrin)

### Ana Sayfa (`/`)
- Sol sidebar: Kategori | Sıralama | Marka | En Çok Satanlar (filtre yok iken)
- Filtre yokken üst kısımda "En Çok Satanlar" bölümü (top 10, satış adedine göre)
- `seededShuffle()` ile günlük sabit karıştırma
- `?kategori=`, `?marka=`, `?sirala=`, `?q=` URL parametreleri

**Özel Koleksiyon filtresi:** `?kategori=ozel-koleksiyon` → `isOzelKoleksiyon: true` sorgusu  
(Gerçek bir DB kategori slug değil, özel kod yolu)

**Kategori sırası:** Kadın, Erkek, Özel Koleksiyon, Unisex (Unisex her zaman sonda)

### Header (`SiteHeader.tsx`)
- Desktop nav: Kadın | Erkek | Özel Koleksiyon | Unisex | Markalar (dropdown) | Sepet | Kullanıcı
- Mobil: Sadece hamburger menü (sepet ikonu yok — bottom nav kaldırıldı)
- Mobil menü: Kadın, Erkek, Unisex, Markalar, Özel Koleksiyon, (Hesabım + Çıkış sadece giriş yapıldıysa)
- **BottomNav tamamen kaldırıldı**

### Ürün Detay Sayfası (`/urunler/[slug]`)
- "Bunları da Beğenebilirsiniz" → sadece **aynı kategori** ürünleri (marka filtresi yok)
- `ProductTabs`: Açıklama | Koku Notaları | Kullanım
  - Koku Notaları: `scentNotes` alanından dinamik (satır satır gösterir)
  - Boşsa "henüz eklenmemiş" mesajı

### Sepet (`/sepet` → `LoggedInCart.tsx`)
**Kupon Kodu:**
- "İndirim Kodu" alanına girilir, "Uygula" butonu tıklanır
- `validateCoupon(code, total)` server action ile doğrulanır
- Geçerliyse toplam güncellenir, sipariş verilince `useCoupon(code)` çağrılır

**Cross-sell (Cinsiyet Önerisi):**
- Sepetteki ürünlerin kategorileri incelenir
- Sadece kadın kategorisi varsa → erkek ürünleri %30 indirimli önerilir
- Sadece erkek kategorisi varsa → kadın ürünleri %30 indirimli önerilir
- Her ikisi de varsa → öneri yapılmaz
- Kategori tespiti: `category.name.toLowerCase().includes("kad")` / `"erkek"`

---

## 7. Rapor Sayfası

### Gelir Hesaplama
```typescript
// PAID web siparişi: gelir = total - discount
// PAID manuel sipariş: gelir = total
// FREE sipariş: gelir = 0

// Kargo gideri: deliveryMethod === "CARGO" ? 200 : 0
const CARGO_FEE = 200;

// Ürün maliyeti: Finance tablosundan (category = "Ürün Maliyeti")
```

### Ürün Satış Geliri (Orantısal Dağıtım)
```typescript
// Sipariş toplamı ile ürün fiyatları farklı olabilir (indirim yapıldıysa)
const itemsSum = items.reduce((s, i) => s + i.price * i.qty, 0);
const scale = itemsSum > 0 ? orderTotal / itemsSum : 1;
revenue = Math.round(item.price * qty * scale); // Yuvarlama şartr
```

---

## 8. Server Actions — Önemli Kurallar

### `lib/actions/product.ts`
- `createProduct(data)` → `productNo` otomatik (PRD-0001 formatı)
- `updateProduct(id, data)` → partial update
- `ProductFormData` tipine `scentNotes?: string` dahil

### `lib/actions/customer.ts`
- `createCustomer(data)` → `{ success: true, id: customer.id }` döner (id önemli!)
- `updateCustomerSegment(id, segment | null)`
- `updateCustomerTags(id, tags[])`

### `lib/actions/order-site.ts` (placeOrder)
```typescript
interface PlaceOrderInput {
  recipientName, recipientPhone, addressLine, city,
  district?, note?, guestItems?, saveAddress?,
  couponCode?,    // kupon kodu
  couponDiscount? // indirim tutarı
}
// Sipariş oluşturulunca Finance tablosuna ürün maliyeti kaydedilir
// Kupon kullanılırsa usedCount artırılır
```

### `lib/actions/site-order-admin.ts` (updateOrderItems)
```typescript
updateOrderItems(id, source, items, total, note, extra?)
// extra: { customerId?, discount?, status?, deliveryMethod? }
// deliveryMethod !== undefined kontrolü (falsy değil, yokluk kontrolü)
```

### `lib/actions/coupon.ts`
- `validateCoupon(code, orderTotal)` → `{ valid, error?, discount?, coupon? }`
- `useCoupon(code)` → usedCount+1
- `createCoupon(data)` / `updateCoupon(id, data)` / `deleteCoupon(id)`
- `getCoupons()` → tüm kuponlar

---

## 9. Önemli Teknik Notlar

### Sipariş Tipleri
- **`Order`** = Admin panelden elle girilen siparişler
- **`SiteOrder`** = Müşteri siteden kendi sipariş verenleri
- Her ikisinin items alanı JSON'dur: `[{productId?, name, qty, price}]`
- Rapor her ikisinden de hesaplar

### PaymentStatus Değerleri
`"PENDING"` | `"PAID"` | `"FREE"`  
FREE: ücretsiz/bedava sipariş — gelire sayılmaz ama kargo gideri olabilir

### DeliveryMethod Değerleri
`"CARGO"` | `"PICKUP"`

### Ürün Segment/Etiket Sistemi
- **Segment:** `GOLD | SILVER | BRONZE | null` — müşteri yanında harf ikonu (G/S/B)
- **Etiketler:** `["B2B", "Toptan", "Sadık", "Kurumsal", "Sorunlu"]` — ayrı sütunda badge

### Özel Koleksiyon
`isOzelKoleksiyon: Boolean` alanı Product'ta. URL'de `?kategori=ozel-koleksiyon` ile filtrelenir. Gerçek bir kategori değil.

### Soft Delete
Ürünler gerçekten silinmez: `deletedAt: DateTime?` set edilir. Tüm sorgularda `where: { deletedAt: null }` şart.

### Font
`Playfair Display` (serif başlıklar) + `Inter` (sans-serif metin), her ikisi de `latin` + `latin-ext` subset (Türkçe karakter desteği için).

---

## 10. Ortam Değişkenleri (`.env`)

```bash
DATABASE_URL=postgresql://...supabase.com:5432/postgres
DIRECT_URL=postgresql://...supabase.com:5432/postgres
NEXTAUTH_URL=http://localhost:3000  # production'da farklı
NEXTAUTH_SECRET=...
JWT_SECRET=...                       # site kullanıcı oturumları
ADMIN_EMAIL=admin@ormivo.com
ADMIN_PASSWORD_HASH=...
BLOB_READ_WRITE_TOKEN=...            # görsel yükleme
```

**Prisma config:** `DATABASE_URL` transaction pooler (port 5432) üzerinden bağlanır.

---

## 11. Deploy Süreci

```bash
# Production deploy (GIT PUSH YETMEZ!)
vercel --prod --yes

# Veya git push sonra promote:
git push origin main    # → Preview ortamına gider
vercel promote <url>    # → Production'a taşır
```

**Limit:** Vercel free plan 100 deploy/gün. Limitde `vercel promote` kullan.

---

## 12. Yaygın Hatalar ve Çözümler

| Hata | Çözüm |
|------|-------|
| `vercel` command not found | `npm install -g vercel` |
| git push → sadece preview | `vercel --prod --yes` kullan |
| 100 deploy limiti | Ertesi gün bekle veya `vercel promote` |
| `prisma migrate dev` shadow DB hatası | `prisma db push` kullan |
| PowerShell `git add app/(admin)/...` | Bash tool ile çalıştır |
| `createCustomer` ID yok | `result.id` kullan (`result.success` değil) |
| Decimal değerler küsuratlı | `Math.round()` veya `Number()` ile dönüştür |

---

## 13. Kod Kalite Kuralları

- **Yorum yok** — iyi isimler yeterli
- **Error handling sadece gerçek hata noktalarında** — iç fonksiyonlar için değil
- **Stil:** Tailwind, renk paleti `#2c1810` (koyu kahve), `#8b6f5e` (orta), `#f5f0eb` (bej)
- **Form state:** `useTransition` yetersizse `useState(false)` + `async/await`
- **Server Actions:** Her zaman `"use server"` ile başlar, `revalidatePath` ile cache temizlenir

---

## 14. Son Yapılan Değişiklikler (2026-06-25)

1. **EditOrderModal yeniden tasarımı** — auto-total sync, "listede yoksa yeni ürün ekle" butonu, warm brown UI
2. **Rapor küsurat fix** — `Math.round()` ile revenue hesabı
3. **Koku Notaları** — `Product.scentNotes` alanı, admin formda textarea, ürün sayfasında dinamik gösterim
4. **Kategori bazlı öneriler** — "Bunları da Beğenebilirsiniz" artık sadece aynı kategoriden
5. **Sepet cross-sell** — cinsiyet tespiti + %30 indirimli öneri (tek cinsiyet sepetinde)
6. **Kupon sistemi** — `Coupon` modeli, admin CRUD sayfası, sepette uygulama, checkout'ta kayıt
7. **Bottom Nav kaldırıldı** — mobil navigasyon header menüye taşındı
8. **Header güncellemeleri** — Özel Koleksiyon header'a eklendi, mobil sepet ikonu + giriş/kayıt linki kaldırıldı
9. **Filter güncelleme** — Özel Koleksiyon Unisex'ten önce gelecek şekilde eklendi
10. **En Çok Satanlar** — ana sayfada üstte bölüm + sol sidebar'da numbered liste
