// import { z } from "zod";

// export const addressSchema = z.object({
//   label: z
//     .string()
//     .trim()
//     .min(1, "Address label is required")
//     .max(30, "Address label is too long"),

//   fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),

//   phone: z.string().trim().min(7, "Please enter a valid phone number"),

//   address: z.string().trim().min(5, "Address must be at least 5 characters"),

//   city: z.string().trim().min(2, "City is required"),

//   state: z.string().trim().min(2, "State is required"),

//   country: z.string().trim().min(2, "Country is required"),

//   isDefault: z.boolean().default(false),
// });

// export type AddressInput = z.infer<typeof addressSchema>;

import { z } from "zod";

import {
  fullNameSchema,
  phoneSchema,
  addressLineSchema,
  citySchema,
  stateSchema,
  countrySchema,
} from "./common";

export const addressSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Address label is required")
    .max(30, "Address label is too long"),

  fullName: fullNameSchema,

  phone: phoneSchema,

  address: addressLineSchema,

  city: citySchema,

  state: stateSchema,

  country: countrySchema,

  isDefault: z.boolean().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;
