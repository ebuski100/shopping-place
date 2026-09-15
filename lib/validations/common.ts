import { z } from "zod";

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Full name must be at least 2 characters")
  .max(100, "Full name is too long")
  .regex(
    /^[a-zA-ZÀ-ÖØ-öø-ÿ][a-zA-ZÀ-ÖØ-öø-ÿ\s'-]*$/,
    "Please enter a valid full name",
  );

export const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^(?:0[789]\d{9}|\+234[789]\d{9}|234[789]\d{9})$/,
    "Please enter a valid Nigerian phone number",
  );

export const addressLineSchema = z
  .string()
  .trim()
  .min(8, "Address must be at least 8 characters")
  .max(200, "Address is too long")
  .refine(
    (value) => /[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(value),
    "Please enter a valid address",
  )
  .refine((value) => {
    const charactersWithoutSpaces = value.replace(/\s/g, "");

    if (charactersWithoutSpaces.length === 0) {
      return false;
    }

    const letters = (charactersWithoutSpaces.match(/[a-zA-ZÀ-ÖØ-öø-ÿ]/g) ?? [])
      .length;

    return letters / charactersWithoutSpaces.length >= 0.3;
  }, "Please enter a meaningful address");

export const citySchema = z
  .string()
  .trim()
  .min(2, "City must be at least 2 characters")
  .max(100, "City is too long")
  .regex(/^[a-zA-ZÀ-ÖØ-öø-ÿ\s'-]+$/, "Please enter a valid city");

export const stateSchema = z
  .string()
  .trim()
  .min(2, "State must be at least 2 characters")
  .max(100, "State is too long")
  .regex(/^[a-zA-ZÀ-ÖØ-öø-ÿ\s'-]+$/, "Please enter a valid state");

export const countrySchema = z
  .string()
  .trim()
  .min(2, "Country must be at least 2 characters")
  .max(100, "Country is too long")
  .regex(/^[a-zA-ZÀ-ÖØ-öø-ÿ\s'-]+$/, "Please enter a valid country");
