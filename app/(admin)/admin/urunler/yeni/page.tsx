import ProductForm from "@/components/admin/ProductForm";

export default function YeniUrunPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-light tracking-wide text-[#2c1810]">
          Yeni Ürün
        </h2>
      </div>
      <ProductForm />
    </div>
  );
}
