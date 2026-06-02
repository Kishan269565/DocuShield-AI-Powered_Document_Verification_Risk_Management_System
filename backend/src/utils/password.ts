import bcrypt from "bcrypt";

/**
 * Hash a plain password before saving to DB
 * @param password - plain text password
 * @returns hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10; // higher = more secure but slower
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare plain password with hashed password
 * @param password - user input password
 * @param hashedPassword - password from DB
 * @returns boolean (match or not)
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};
