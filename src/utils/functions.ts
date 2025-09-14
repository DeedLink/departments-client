export const compressAddress = (address : string) => {
  return `${address.slice(0, 6)}`+'...'+`${address.slice(-4)}`
}

export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const nicRegex = /^(?:\d{9}[VvXx]|\d{12})$/;

export const isValidPassword = (password: string) => {
  return passwordRegex.test(password);
};

export const isValidEmail = (email: string) => {
  return emailRegex.test(email);
};

export const isValidNIC = (nic: string) => {
  return nicRegex.test(nic);
};