import Result "mo:base/Result";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Blob "mo:base/Blob";
import Time "mo:base/Time";
import Int "mo:base/Int";

module {
    // ============================================
    // Type Definitions
    // ============================================
    
    public type ValidationError = Text;
    public type ValidationResult = Result.Result<(), ValidationError>;
    
    // ============================================
    // Principal Validation
    // ============================================
    
    public func validatePrincipal(p: Principal): ValidationResult {
        if (Principal.isAnonymous(p)) {
            #err("Principal cannot be anonymous")
        } else {
            #ok()
        }
    };
    
    public func validateRecipient(p: Principal): ValidationResult {
        if (Principal.isAnonymous(p)) {
            #err("Recipient cannot be anonymous")
        } else if (Principal.isController(p)) {
            #err("Cannot send to controller principal")  
        } else {
            #ok()
        }
    };
    
    // ============================================
    // Amount Validation
    // ============================================
    
    public func validateAmount(amount: Nat, minAmount: Nat): ValidationResult {
        if (amount == 0) {
            #err("Amount must be greater than zero")
        } else if (amount < minAmount) {
            #err("Amount below minimum: " # Nat.toText(minAmount))
        } else {
            #ok()
        }
    };
    
    public func validateTransferAmount(amount: Nat, balance: Nat, fee: Nat): ValidationResult {
        if (amount == 0) {
            return #err("Transfer amount must be greater than zero");
        };
        
        let totalRequired = amount + fee;
        if (totalRequired > balance) {
            #err("Insufficient balance. Required: " # Nat.toText(totalRequired) # ", Available: " # Nat.toText(balance))
        } else {
            #ok()
        }
    };
    
    // ============================================
    // Text Validation
    // ============================================
    
    public func validateText(text: Text, fieldName: Text, maxLength: Nat): ValidationResult {
        if (Text.size(text) == 0) {
            #err(fieldName # " cannot be empty")
        } else if (Text.size(text) > maxLength) {
            #err(fieldName # " exceeds maximum length of " # Nat.toText(maxLength))
        } else {
            #ok()
        }
    };
    
    public func validateMemo(memo: Text): ValidationResult {
        validateText(memo, "Memo", 256)
    };
    
    public func validatePurpose(purpose: Text): ValidationResult {
        validateText(purpose, "Purpose", 128)
    };
    
    // ============================================
    // Escrow Validation
    // ============================================
    
    public func validateEscrowDuration(expirationTime: Time.Time): ValidationResult {
        let now = Time.now();
        let minDuration = 3600_000_000_000; // 1 hour in nanoseconds
        let maxDuration = 31536000_000_000_000; // 1 year in nanoseconds
        
        if (expirationTime <= now) {
            #err("Expiration time must be in the future")
        } else if (expirationTime - now < minDuration) {
            #err("Escrow duration must be at least 1 hour")
        } else if (expirationTime - now > maxDuration) {
            #err("Escrow duration cannot exceed 1 year")
        } else {
            #ok()
        }
    };
    
    public func validateEscrowCondition(condition: Text): ValidationResult {
        if (Text.size(condition) == 0) {
            #err("Escrow condition cannot be empty")
        } else if (Text.size(condition) > 500) {
            #err("Escrow condition exceeds maximum length of 500 characters")
        } else {
            #ok()
        }
    };
    
    // ============================================
    // Batch Operation Validation
    // ============================================
    
    public func validateBatchSize(size: Nat, maxSize: Nat): ValidationResult {
        if (size == 0) {
            #err("Batch cannot be empty")
        } else if (size > maxSize) {
            #err("Batch size exceeds maximum of " # Nat.toText(maxSize))
        } else {
            #ok()
        }
    };
    
    // ============================================
    // Rate Limiting
    // ============================================
    
    public func checkRateLimit(
        lastActionTime: Time.Time,
        minInterval: Nat // in nanoseconds
    ): ValidationResult {
        let now = Time.now();
        let elapsed = Int.abs(now - lastActionTime);
        
        if (elapsed < minInterval) {
            let remainingSeconds = (minInterval - elapsed) / 1_000_000_000;
            #err("Rate limit exceeded. Please wait " # Nat.toText(remainingSeconds) # " seconds")
        } else {
            #ok()
        }
    };
    
    // ============================================
    // Subaccount Validation
    // ============================================
    
    public func validateSubaccount(subaccount: ?Blob): ValidationResult {
        switch (subaccount) {
            case (null) { #ok() };
            case (?blob) {
                if (blob.size() != 32) {
                    #err("Subaccount must be exactly 32 bytes")
                } else {
                    #ok()
                }
            };
        }
    };
    
    // ============================================
    // Combined Validation
    // ============================================
    
    public func combineResults(results: [ValidationResult]): ValidationResult {
        for (result in results.vals()) {
            switch (result) {
                case (#err(e)) { return #err(e) };
                case (#ok()) {};
            };
        };
        #ok()
    };
    
    // ============================================
    // Sanitization Functions
    // ============================================
    
    public func sanitizeText(text: Text): Text {
        // Remove leading and trailing whitespace
        Text.trim(text, #text " ")
    };
    
    public func sanitizeMemo(memo: Text): Text {
        let trimmed = sanitizeText(memo);
        // Truncate if too long
        if (Text.size(trimmed) > 256) {
            Text.extract(trimmed, 0, 256)
        } else {
            trimmed
        }
    };
};