"use client";

type QuantitySelectorProps = {
  quantity: number;
  stock: number;
  onQuantityChange: (quantity: number) => void;
  disabled?: boolean;
};

const QuantitySelector = ({
  quantity,
  stock,
  onQuantityChange,
  disabled = false,
}: QuantitySelectorProps) => {
  function decreaseQuantity() {
    const newQuantity = Math.max(1, quantity - 1);

    if (newQuantity !== quantity) {
      onQuantityChange(newQuantity);
    }
  }

  function increaseQuantity() {
    const newQuantity = Math.min(stock, quantity + 1);

    if (newQuantity !== quantity) {
      onQuantityChange(newQuantity);
    }
  }

  return (
    <div className="flex items-center">
      <div className="flex w-fit items-center overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <button
          type="button"
          onClick={decreaseQuantity}
          disabled={disabled || quantity <= 1}
          className="flex h-10 w-10 items-center justify-center text-lg transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>

        <span className="flex h-10 w-12 items-center justify-center border-x border-gray-200 dark:border-gray-800 font-semibold">
          {quantity}
        </span>

        <button
          type="button"
          onClick={increaseQuantity}
          disabled={disabled || quantity >= stock}
          className="flex h-10 w-10 items-center justify-center text-lg transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default QuantitySelector;
