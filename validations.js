const Validator = require("validator");

let exportFuns = {};

const isEmpty = (value) =>
    value === undefined ||
    value === null ||
    (typeof value === "object" && Object.keys(value).length === 0) ||
    (typeof value === "string" && value.trim().length === 0);

module.exports = isEmpty;


exportFuns.checkMobile = (data) => {
    let errors = {};
    let error = "";
    // //console.log(data)
    data.phone_number = !isEmpty(data.phone_number) ? data.phone_number : "";

    if (Validator.isEmpty(data.phone_number)) {
        errors.phone_number = "Phone number field is required";
        error = errors.phone_number;
    } else {
        if (!Validator.isNumeric(data.phone_number, { no_symbols: false })) {
            errors.phone_number = "Phone number field is invalid";
            error = errors.phone_number;
        } else {
            if (data.phone_number.length != 10) {
                errors.phone_number = "Phone number field size is invalid";
                error = errors.phone_number;
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
        error,
    };
};

exportFuns.checkMobileAndOtp = (data) => {
    let errors = {};
    let error = "";

    data.phone_number = !isEmpty(data.phone_number) ? data.phone_number : "";

    if (Validator.isEmpty(data.phone_number)) {
        errors.phone_number = "Phone number field is required";
        error = errors.phone_number;
    } else {
        if (!Validator.isNumeric(data.phone_number, { no_symbols: false })) {
            errors.phone_number = "Phone number field is invalid";
            error = errors.phone_number;
        } else {
            if (data.phone_number.length != 10) {
                errors.phone_number = "Phone number field size is invalid";
                error = errors.phone_number;
            }
        }
    }

    data.otp = !isEmpty(data.otp) ? data.otp : "";

    if (Validator.isEmpty(data.otp)) {
        errors.otp = "OTP field is required";
        error = errors.otp;
    } else {
        if (!Validator.isNumeric(data.otp, { no_symbols: false })) {
            errors.otp = "OTP field is invalid";
            error = errors.otp;
        } else {
            if (data.otp.length != 6) {
                errors.otp = "OTP field size is invalid";
                error = errors.otp;
            }
        }
    }

    return {
        errors,
        isValid: isEmpty(errors),
        error,
    };
};

module.exports = exportFuns