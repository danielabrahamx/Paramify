import Result "mo:base/Result";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Float "mo:base/Float";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Char "mo:base/Char";
import Iter "mo:base/Iter";

module {
    // ============================================
    // Validation Types
    // ============================================
    
    public type ValidationError = {
        field: Text;
        message: Text;
    };
    
    public type ValidationResult = Result.Result<(), [ValidationError]>;
    
    // ============================================
    // String Validators
    // ============================================
    
    // Check if string is empty or only whitespace
    public func isEmptyOrWhitespace(str: Text): Bool {
        Text.size(Text.trim(str, #text " ")) == 0
    };
    
    // Check if string contains only alphanumeric characters
    public func isAlphanumeric(str: Text): Bool {
        for (char in Text.toIter(str)) {
            if (not (Char.isAlphabetic(char) or Char.isDigit(char))) {
                return false;
            };
        };
        true
    };
    
    // Validate string length
    public func validateStringLength(
        str: Text,
        minLength: Nat,
        maxLength: Nat,
        fieldName: Text
    ): ValidationResult {
        let length = Text.size(str);
        if (length < minLength) {
            #err([{
                field = fieldName;
                message = "Must be at least " # Nat.toText(minLength) # " characters";
            }])
        } else if (length > maxLength) {
            #err([{
                field = fieldName;
                message = "Must be at most " # Nat.toText(maxLength) # " characters";
            }])
        } else {
            #ok()
        }
    };
    
    // Validate USGS site ID format (should be numeric string)
    public func validateUSGSSiteId(siteId: Text): ValidationResult {
        if (isEmptyOrWhitespace(siteId)) {
            return #err([{
                field = "location";
                message = "USGS site ID cannot be empty";
            }]);
        };
        
        if (Text.size(siteId) < 8 or Text.size(siteId) > 15) {
            return #err([{
                field = "location";
                message = "USGS site ID must be between 8 and 15 characters";
            }]);
        };
        
        // Check if all characters are digits
        for (char in Text.toIter(siteId)) {
            if (not Char.isDigit(char)) {
                return #err([{
                    field = "location";
                    message = "USGS site ID must contain only digits";
                }]);
            };
        };
        
        #ok()
    };
    
    // ============================================
    // Number Validators
    // ============================================
    
    // Validate coverage amount
    public func validateCoverageAmount(
        coverage: Nat,
        minCoverage: Nat,
        maxCoverage: Nat
    ): ValidationResult {
        if (coverage < minCoverage) {
            #err([{
                field = "coverage";
                message = "Coverage must be at least " # Nat.toText(minCoverage) # " tokens";
            }])
        } else if (coverage > maxCoverage) {
            #err([{
                field = "coverage";
                message = "Coverage cannot exceed " # Nat.toText(maxCoverage) # " tokens";
            }])
        } else {
            #ok()
        }
    };
    
    // Validate duration in days
    public func validateDuration(durationDays: Nat): ValidationResult {
        if (durationDays == 0) {
            #err([{
                field = "durationDays";
                message = "Duration must be at least 1 day";
            }])
        } else if (durationDays > 365) {
            #err([{
                field = "durationDays";
                message = "Duration cannot exceed 365 days";
            }])
        } else {
            #ok()
        }
    };
    
    // Validate threshold value
    public func validateThreshold(thresholdFeet: Float): ValidationResult {
        if (thresholdFeet <= 0.0) {
            #err([{
                field = "threshold";
                message = "Threshold must be greater than 0";
            }])
        } else if (thresholdFeet > 100.0) {
            #err([{
                field = "threshold";
                message = "Threshold cannot exceed 100 feet";
            }])
        } else {
            #ok()
        }
    };
    
    // Validate percentage value
    public func validatePercentage(percentage: Nat): ValidationResult {
        if (percentage == 0) {
            #err([{
                field = "percentage";
                message = "Percentage must be greater than 0";
            }])
        } else if (percentage > 100) {
            #err([{
                field = "percentage";
                message = "Percentage cannot exceed 100";
            }])
        } else {
            #ok()
        }
    };
    
    // ============================================
    // Principal Validators
    // ============================================
    
    // Validate principal is not anonymous
    public func validatePrincipal(principal: Principal, fieldName: Text): ValidationResult {
        if (Principal.isAnonymous(principal)) {
            #err([{
                field = fieldName;
                message = "Principal cannot be anonymous";
            }])
        } else {
            #ok()
        }
    };
    
    // Validate array of principals
    public func validatePrincipals(principals: [Principal], fieldName: Text): ValidationResult {
        if (principals.size() == 0) {
            return #err([{
                field = fieldName;
                message = "At least one principal must be provided";
            }]);
        };
        
        var errors: [ValidationError] = [];
        
        for (i in Iter.range(0, principals.size() - 1)) {
            let p = principals[i];
            if (Principal.isAnonymous(p)) {
                errors := Array.append(errors, [{
                    field = fieldName # "[" # Nat.toText(i) # "]";
                    message = "Principal cannot be anonymous";
                }]);
            };
        };
        
        if (errors.size() > 0) {
            #err(errors)
        } else {
            #ok()
        }
    };
    
    // ============================================
    // Combined Validators
    // ============================================
    
    // Combine multiple validation results
    public func combineResults(results: [ValidationResult]): ValidationResult {
        var allErrors: [ValidationError] = [];
        
        for (result in results.vals()) {
            switch (result) {
                case (#err(errors)) {
                    allErrors := Array.append(allErrors, errors);
                };
                case (#ok()) {};
            };
        };
        
        if (allErrors.size() > 0) {
            #err(allErrors)
        } else {
            #ok()
        }
    };
    
    // ============================================
    // Sanitization Functions
    // ============================================
    
    // Sanitize text input by trimming whitespace
    public func sanitizeText(text: Text): Text {
        Text.trim(text, #text " ")
    };
    
    // Sanitize and validate a numeric string
    public func sanitizeNumericString(str: Text): Result.Result<Text, Text> {
        let sanitized = sanitizeText(str);
        
        for (char in Text.toIter(sanitized)) {
            if (not Char.isDigit(char)) {
                return #err("Input contains non-numeric characters");
            };
        };
        
        #ok(sanitized)
    };
    
    // ============================================
    // Rate Limiting Helpers
    // ============================================
    
    // Check if enough time has passed since last action
    public func checkRateLimit(
        lastActionTime: Time.Time,
        minIntervalNanos: Nat
    ): Bool {
        let currentTime = Time.now();
        let elapsed = Int.abs(currentTime - lastActionTime);
        elapsed >= minIntervalNanos
    };
};