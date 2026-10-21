import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function emailValidator(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const forbidden = !control.value.endsWith('gmail.com');
    return forbidden ? { forbiddenEmail: { value: control.value } } : null;
  };
}
export function passwordStrengthValidator(): ValidatorFn {
  const pattern = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,20}$/;

  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value.match(pattern)) {
      return { weakPassword: 'Mot de passe faible' };
    }
    return null;
  };
}

export function passwordValidator(password: string, passwordConfirmation: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    // date are formated as 'yyyy-mm-dd'
    const value1 = control.get(password)?.value;
    const value2 = control.get(passwordConfirmation)?.value;
    const pattern = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,20}$/;
    if (!value1.match(pattern)) {
      return {
        weakPassword: 'Mot de passe faible',
      };
    }

    if (value1 !== value2)
      return {
        passwordDifference: 'Mots de passe differents',
      };
    return null;
  };
}

export function ageValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    const birthdate = new Date(control.value);
    if (isNaN(birthdate.getTime())) {
      return { underage: 'Date invalide' };
    }

    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const monthDifference = today.getMonth() - birthdate.getMonth();
    const dayDifference = today.getDate() - birthdate.getDate();

    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
      age--;
    }

    return age >= 13 ? null : { underage: "L'âge doit être supérieur à 13 ans" };
  };
}

export function siretValidator(): ValidatorFn {
  return (control: AbstractControl<string | number | null>): ValidationErrors | null => {
    if (control.value === null || control.value === undefined || control.value === '') {
      return null; // champ vide = valide (laisser Required gérer ça)
    }

    const siret = String(control.value).replace(/\s/g, '');

    if (!/^\d{14}$/.test(siret)) {
      return { siret: 'Le SIRET doit contenir 14 chiffres' };
    }

    // Exception La Poste : SIRET valide si la somme des chiffres est divisible par 5
    if (siret.startsWith('356000000')) {
      const digitSum = siret.split('').reduce((sum, digit) => sum + Number(digit), 0);
      return digitSum % 5 === 0 ? null : { siret: 'Numéro de SIRET invalide' };
    }

    // Algorithme de Luhn
    let sum = 0;
    for (let i = 0; i < siret.length; i++) {
      let digit = Number(siret[i]);
      // on double un chiffre sur deux en partant de la droite (positions paires depuis la gauche)
      if (i % 2 === 0) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
    }

    return sum % 10 === 0 ? null : { siret: 'Numéro de SIRET invalide' };
  };
}

type SocialMedia = 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'github';

const SOCIAL_MEDIA_PATTERNS: Record<SocialMedia, RegExp> = {
  facebook: /^https?:\/\/(www\.)?facebook\.com\/.+$/i,
  twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+$/i,
  instagram: /^https?:\/\/(www\.)?instagram\.com\/.+$/i,
  linkedin: /^https?:\/\/(www\.)?linkedin\.com\/.+$/i,
  github: /^https?:\/\/(www\.)?github\.com\/.+$/i,
};

export function socialMediaUrlValidator(platform: SocialMedia): ValidatorFn {
  return (control: AbstractControl<string | null>) => {
    if (!control.value) {
      return null; // champ vide = valide (laisser Required gérer ça)
    }

    const pattern = SOCIAL_MEDIA_PATTERNS[platform];

    const isValid = pattern.test(control.value);

    return isValid
      ? null
      : {
          socialMediaError: `L'URL ne correspond pas au format de ${platform}.`,
        };
  };
}
