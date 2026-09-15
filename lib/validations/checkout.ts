// import { z } from "zod";

// export const checkoutSchema = z.object({
//   fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),

//   phone: z.string().trim().min(7, "Please enter a valid phone number"),

//   address: z.string().trim().min(5, "Address must be at least 5 characters"),

//   city: z.string().trim().min(2, "City is required"),

//   state: z.string().trim().min(2, "State is required"),

//   country: z.string().trim().min(2, "Country is required"),

//   deliveryMethod: z.enum(["free", "standard", "express"]),
// });

// export type CheckoutInput = z.infer<typeof checkoutSchema>;

import { z } from "zod";

import {
  fullNameSchema,
  phoneSchema,
  addressLineSchema,
  citySchema,
  stateSchema,
  countrySchema,
} from "./common";

export const checkoutSchema = z.object({
  fullName: fullNameSchema,

  phone: phoneSchema,

  address: addressLineSchema,

  city: citySchema,

  state: stateSchema,

  country: countrySchema,

  deliveryMethod: z.enum(["free", "standard", "express"]),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
