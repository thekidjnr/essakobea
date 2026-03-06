import Image from "next/image";
import Link from "next/link";

const products = [
  {
    id: 1,
    name: "The Silk Press Unit",
    type: "Lace Front",
    price: "$340",
    image:
      "https://images.pexels.com/photos/2065195/pexels-photo-2065195.jpeg?auto=compress&cs=tinysrgb&w=800&q=85",
    aspect: "tall",
  },
  {
    id: 2,
    name: "The Obsidian Wave",
    type: "Full Lace",
    price: "$480",
    image:
      "https://images.pexels.com/photos/2876486/pexels-photo-2876486.jpeg?auto=compress&cs=tinysrgb&w=800&q=85",
    aspect: "wide",
  },
  {
    id: 3,
    name: "The Golden Hour",
    type: "Closure Unit",
    price: "$290",
    image:
      "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=800&q=85",
    aspect: "wide",
  },
  {
    id: 4,
    name: "The Midnight Bob",
    type: "Lace Front",
    price: "$260",
    image:
      "https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=800&q=85",
    aspect: "tall",
  },
];

export default function Collection() {
  return (
    <section id="collection" className="bg-mist py-28 md:py-36">
      <div className="px-6 md:px-16 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-6">
          <div>
            <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-4">
              The Edit
            </p>
            <h2 className="font-serif text-[clamp(2.5rem,5vw,5rem)] leading-none font-light text-ink">
              New <span className="italic">Collection</span>
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-3 font-sans text-[11px] tracking-widest uppercase text-ink self-end md:self-auto"
          >
            <span className="border-b border-ink/40 pb-px hover:border-ink transition-colors">
              View All Pieces
            </span>
            <span>→</span>
          </Link>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* Tall item — spans 2 rows */}
          <div className="col-span-1 md:row-span-2 group cursor-pointer">
            <div className="relative overflow-hidden bg-stone/10 aspect-[3/4] md:aspect-auto md:h-full">
              <Image
                src={products[0].image}
                alt={products[0].name}
                fill
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                <span className="font-sans text-[11px] tracking-widest uppercase text-paper bg-ink px-3 py-1.5">
                  Quick View
                </span>
              </div>
            </div>
            <ProductInfo product={products[0]} />
          </div>

          {/* Regular items */}
          {products.slice(1).map((product) => (
            <div key={product.id} className="col-span-1 group cursor-pointer">
              <div className="relative overflow-hidden bg-stone/10 aspect-[3/4]">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  <span className="font-sans text-[11px] tracking-widest uppercase text-paper bg-ink px-3 py-1.5">
                    Quick View
                  </span>
                </div>
              </div>
              <ProductInfo product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductInfo({
  product,
}: {
  product: { name: string; type: string; price: string };
}) {
  return (
    <div className="pt-4 flex items-start justify-between">
      <div>
        <p className="font-sans text-[10px] tracking-widest uppercase text-ink/40 mb-1">
          {product.type}
        </p>
        <h3 className="font-serif text-[1.1rem] font-light text-ink leading-snug">
          {product.name}
        </h3>
      </div>
      <span className="font-sans text-[13px] text-ink/60 font-light pt-5">
        {product.price}
      </span>
    </div>
  );
}
