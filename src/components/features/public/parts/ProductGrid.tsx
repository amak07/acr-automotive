"use client";

interface ProductGridProps {
  results: any[];
}

export function ProductGrid({ results }: ProductGridProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-acr-gray-500 text-lg">
          Usa el buscador para encontrar refacciones
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((product) => (
        <div
          key={product.id}
          className="bg-white border border-acr-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          {/* Product Image */}
          <div className="aspect-square bg-acr-gray-100 rounded-lg mb-4 flex items-center justify-center">
            <div className="w-24 h-24 bg-acr-gray-300 rounded"></div>
          </div>

          {/* Product Info */}
          <div className="text-center">
            <h3 className="font-bold text-lg text-acr-gray-900 mb-1">
              SKU: {product.sku}
            </h3>
            <p className="text-sm text-acr-gray-600 mb-2">
              CLASE: {product.clase}
            </p>
            <p className="text-sm font-medium text-acr-gray-700">
              MARCA: {product.marca}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}