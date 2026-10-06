"use client";
import {
  EditorForm,
  type EditorSession,
  type FormReader,
} from "@/components/encore-ui/editor-form";
import {
  AmountFields,
  Field,
  FieldRow,
  SelectField,
} from "@/components/encore-ui/form-fields";
import { fromJstInput, parseMoney, toJstInput } from "@/lib/encore/form-input";
import type { Application, Currency, Editor } from "@/lib/encore/model";
import { useConcertDemoStore } from "./concert-demo-store";

export type ApplicationEditorTarget = Extract<Editor, { type: "application" }>;

const providers = [
  "ASOBI TICKET",
  "eplus",
  "l-tike",
  "CyStore ticket",
  "Other",
];
const results: Application["result"][] = [
  "Pending",
  "Won",
  "Lost",
  "Waitlisted",
];
const payments: Application["payment"][] = [
  "Unpaid",
  "Paid",
  "Not required",
  "Refunded",
];
const collections: Application["collection"][] = [
  "Not ready",
  "Ready",
  "Collected",
];

/**
 * Add or edit a ticket application round. Submission, result, payment and
 * collection are independent states; the reminder preference is kept.
 */
export function ApplicationEditor({
  target,
  session,
}: {
  target: ApplicationEditorTarget;
  session: EditorSession;
}) {
  const store = useConcertDemoStore();
  const existing = store.findApplication(target.id);

  function save(read: FormReader) {
    const price = parseMoney(
      read("amount"),
      read("currency"),
      store.defaultCurrency,
    );
    store.saveApplication(
      applicationFromForm(read, price, target.concertId, existing),
      { isNew: !existing },
    );
  }

  return (
    <EditorForm
      session={session}
      title={(target.id ? "Edit" : "Add") + " ticket application"}
      onSave={save}
    >
      <Field
        name="round"
        label="Application round"
        value={existing?.round}
        required
        placeholder="Fanclub advance lottery"
      />
      <SelectField
        name="provider"
        label="Ticket provider"
        value={existing?.provider ?? "ASOBI TICKET"}
        options={providers}
      />
      <Field
        name="deadline"
        label="Application deadline · JST"
        value={toJstInput(existing?.deadline ?? "")}
        type="datetime-local"
      />
      <Field
        name="resultDate"
        label="Results announced · JST"
        value={toJstInput(existing?.resultDate ?? "")}
        type="datetime-local"
      />
      <Field
        name="paymentDeadline"
        label="Payment deadline · JST"
        value={toJstInput(existing?.paymentDeadline ?? "")}
        type="datetime-local"
      />
      <FieldRow>
        <SelectField
          name="submitted"
          label="Application submitted?"
          value={existing?.submitted ? "Yes" : "No"}
          options={["No", "Yes"]}
        />
        <SelectField
          name="result"
          label="Lottery result"
          value={existing?.result ?? "Pending"}
          options={results}
        />
      </FieldRow>
      <AmountFields
        amount={existing?.amount}
        currency={existing?.currency ?? store.defaultCurrency}
      />
      <FieldRow>
        <SelectField
          name="payment"
          label="Payment"
          value={existing?.payment ?? "Unpaid"}
          options={payments}
        />
        <SelectField
          name="collection"
          label="Ticket collection"
          value={existing?.collection ?? "Not ready"}
          options={collections}
        />
      </FieldRow>
    </EditorForm>
  );
}

function applicationFromForm(
  read: FormReader,
  price: { amount: number; currency: Currency },
  concertId: string,
  existing?: Application,
): Application {
  return {
    id: existing?.id ?? crypto.randomUUID(),
    concertId,
    round: read("round"),
    provider: read("provider"),
    deadline: fromJstInput(read("deadline")),
    resultDate: fromJstInput(read("resultDate")),
    paymentDeadline: fromJstInput(read("paymentDeadline")),
    submitted: read("submitted") === "Yes",
    // The selects only offer these states.
    result: read("result") as Application["result"],
    payment: read("payment") as Application["payment"],
    collection: read("collection") as Application["collection"],
    amount: price.amount,
    currency: price.currency,
    reminder: existing?.reminder ?? false,
    offset: existing?.offset ?? "1 day",
  };
}
