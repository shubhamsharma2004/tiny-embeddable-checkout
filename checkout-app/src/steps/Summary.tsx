import { Product, formatPrice } from '../catalog';
import { ProductIllustration } from '../ProductIllustration';

interface Props {
  product: Product;
  selectedVariantId: string;
  onSelectVariant: (variantId: string) => void;
  onContinue: () => void;
}

export function Summary({ product, selectedVariantId, onSelectVariant, onContinue }: Props) {
  const selected =
    product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0];

  return (
    <div className="step">
      <h1 className="step-title">Review your order</h1>
      <p className="step-subtitle">Choose a color, then continue.</p>

      <div className="product-card">
        <div className="product-card__image">
          <ProductIllustration color={selected.color} />
        </div>
        <div className="product-card__info">
          <p className="product-card__name">{product.name}</p>
          <p className="product-card__desc">{product.description}</p>
        </div>
        <div className="product-card__price">
          {formatPrice(selected.priceCents, product.currency)}
        </div>
      </div>

      <div className="variant-grid">
        {product.variants.map((variant) => {
          const isSelected = variant.id === selectedVariantId;
          return (
            <button
              key={variant.id}
              type="button"
              className={'variant-swatch' + (isSelected ? ' variant-swatch--selected' : '')}
              aria-pressed={isSelected}
              onClick={() => onSelectVariant(variant.id)}
            >
              <span className="variant-swatch__dot" style={{ background: variant.color }} />
              <span className="variant-swatch__text">
                <span className="variant-swatch__label">{variant.label}</span>
                <span className="variant-swatch__price">
                  {formatPrice(variant.priceCents, product.currency)}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="actions">
        {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
        <button className="primary" type="button" onClick={onContinue} autoFocus>
          Continue
        </button>
      </div>
    </div>
  );
}
