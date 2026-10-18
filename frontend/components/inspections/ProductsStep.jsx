'use client';

import { Checkbox, FormField, FormSection } from './FormField';
import { LIMITS } from '../../lib/inspectionForm';

export default function ProductsStep({ formData, errors, productGroups, onToggle, onOtherDescription, readOnly }) {
  const { products } = formData;

  return (
    <FormSection
      number="5"
      title="Type of Product Stocked"
      description="Select every category currently held by the outlet."
    >
      {productGroups.map((group) => (
        <div className="inspection-product-group" key={group.key}>
          <h3 className="inspection-subheading">{group.title}</h3>
          <div className="inspection-checkbox-grid">
            {group.items.map((item) => {
              const id = `product-${group.key}-${item.key}`;
              return (
                <Checkbox
                  key={item.key}
                  id={id}
                  label={item.label}
                  checked={products[group.key][item.key]}
                  onChange={(checked) => onToggle(group.key, item.key, checked)}
                  disabled={readOnly}
                />
              );
            })}
          </div>
        </div>
      ))}

      {products.otherProducts.others && (
        <FormField
          id="otherProductsDescription"
          label="Specify Other Products"
          required
          error={errors['formData.products.otherProducts.otherDescription']}
        >
          <input
            id="otherProductsDescription"
            type="text"
            value={products.otherProducts.otherDescription}
            onChange={(event) => onOtherDescription(event.target.value)}
            disabled={readOnly}
            maxLength={LIMITS.otherProductsDescriptionMax}
            required
            aria-invalid={Boolean(errors['formData.products.otherProducts.otherDescription'])}
          />
        </FormField>
      )}
    </FormSection>
  );
}
