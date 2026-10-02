"use client";
import { useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Choice } from "@/components/encore-ui/ui";
import { amountInputValue, currencies } from "@/lib/encore/form-input";
import type { Currency } from "@/lib/encore/model";

export function Field({
  label,
  name,
  type = "text",
  value = "",
  required = false,
  placeholder,
  children,
}: {
  label: string;
  name: string;
  type?: string;
  value?: string;
  required?: boolean;
  placeholder?: string;
  children?: ReactNode;
}) {
  return (
    <label className="form-field" htmlFor={"field-" + name}>
      <span>
        {label}
        {required && " *"}
      </span>
      {children ?? (
        <Input
          id={"field-" + name}
          name={name}
          type={type}
          defaultValue={value}
          required={required}
          placeholder={placeholder}
          step={type === "number" ? "any" : undefined}
        />
      )}
    </label>
  );
}

/** A select menu that submits its value with the form. */
export function SelectField({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: (string | { value: string; label: string })[];
}) {
  const [selected, setSelected] = useState(value);
  return (
    <Field label={label} name={name}>
      <input type="hidden" name={name} value={selected} />
      <Choice
        id={"field-" + name}
        label={label}
        value={selected}
        onChange={setSelected}
        options={options}
      />
    </Field>
  );
}

/** "amount" and "currency" inputs, read back with `parseMoney`. */
export function AmountFields({
  amount = 0,
  currency = "JPY",
}: {
  amount?: number;
  currency?: Currency;
}) {
  return (
    <div className="form-grid">
      <Field
        name="amount"
        label="Amount"
        type="number"
        value={amountInputValue(amount, currency)}
      />
      <SelectField
        name="currency"
        label="Currency"
        value={currency}
        options={currencies}
      />
    </div>
  );
}
