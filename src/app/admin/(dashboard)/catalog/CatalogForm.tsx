import type { CatalogItem } from "@/generated/prisma/client";
import { CheckboxRow } from "@/components/admin/bits";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { centsToInput } from "@/components/admin/form";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { MediaImage } from "@/components/MediaImage";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { CATALOG_CATEGORIES, CATALOG_CATEGORY_LABELS } from "@/lib/labels";

import { deleteCatalogItem, saveCatalogItem } from "./actions";

type PromotionOption = { id: string; title: string; publishedAt: Date | null };

export function CatalogForm({ item, promotions, defaultCategory }: { item: CatalogItem | null; promotions: PromotionOption[]; defaultCategory?: string }) {
  return (
    <form action={saveCatalogItem} className="flex flex-col gap-4" encType="multipart/form-data">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}

      <Field label="Name">
        <Input name="name" defaultValue={item?.name ?? ""} required maxLength={120} placeholder="M18 FUEL Hammer Drill Kit" autoComplete="off" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category">
          <Select name="category" defaultValue={item?.category ?? defaultCategory ?? "TOOL"}>
            {CATALOG_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATALOG_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Brand">
          <Input name="brand" defaultValue={item?.brand ?? ""} maxLength={60} placeholder="Milwaukee, Muddy, Hawk" />
        </Field>
      </div>

      <Field label="Description" hint="The first line shows on cards; the rest on the item's page.">
        <Textarea name="description" rows={4} defaultValue={item?.description ?? ""} maxLength={4000} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Price (dollars)" hint="Blank shows “Call for price”.">
          <Input name="price" inputMode="decimal" defaultValue={centsToInput(item?.priceCents)} placeholder="389" />
        </Field>
        <Field label="Price note" hint="“from”, “each”, “installed”">
          <Input name="priceNote" defaultValue={item?.priceNote ?? ""} maxLength={60} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Stock note" hint="“4 left”, “back in stock”">
          <Input name="stockNote" defaultValue={item?.stockNote ?? ""} maxLength={60} />
        </Field>
        <Field label="Badge on the photo" hint="“$100 OFF”, “FREE BATTERY”">
          <Input name="badge" defaultValue={item?.badge ?? ""} maxLength={24} />
        </Field>
      </div>

      <Field label="Part of a promotion?" hint="Tapping the deal opens that flyer instead of its own page.">
        <Select name="promotionId" defaultValue={item?.promotionId ?? ""}>
          <option value="">No, stands alone</option>
          {promotions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
              {p.publishedAt ? "" : " (draft)"}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Photos" hint="Pick one or several; new ones are added after the current photos.">
        <Input name="images" type="file" accept="image/*" multiple className="py-2" />
      </Field>
      {item?.imageKeys.length ? (
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3">
          {item.imageKeys.map((key, index) => (
            <li key={key} className="flex flex-col gap-1.5 rounded border border-line p-2">
              <MediaImage imageKey={key} alt="" size="thumb" className="aspect-square w-full rounded object-cover" />
              <label className="flex items-center gap-2 text-[13px] font-semibold">
                <input type="radio" name="firstImage" value={key} defaultChecked={index === 0} className="h-5 w-5 accent-brand" /> Main photo
              </label>
              <label className="flex items-center gap-2 text-[13px] font-semibold text-brand">
                <input type="checkbox" name="removeImage" value={key} className="h-5 w-5 accent-brand" /> Remove
              </label>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sort" hint="Lower numbers come first. The Top deals page has up/down buttons.">
          <Input name="sortOrder" type="number" inputMode="numeric" defaultValue={item?.sortOrder ?? 0} />
        </Field>
      </div>

      <CheckboxRow name="featured" defaultChecked={item?.featured ?? false} label="Top deal on the homepage" hint="Up to 6 featured items show in “Top deals”, ordered by Sort." />
      <CheckboxRow name="active" defaultChecked={item?.active ?? true} label="Active (shown on the site)" hint="Uncheck to hide it without deleting (sold out, off season)." />

      <SubmitButton full className="h-14 text-[18px]" pendingText="Saving (uploading photos)…">
        {item ? "Save changes" : "Add item"}
      </SubmitButton>

      {item ? (
        <ConfirmButton formAction={deleteCatalogItem} formNoValidate message={`Delete "${item.name}" and its photos?`} variant="outline" className="border-brand text-brand hover:bg-brand hover:text-white">
          Delete item
        </ConfirmButton>
      ) : null}
    </form>
  );
}
