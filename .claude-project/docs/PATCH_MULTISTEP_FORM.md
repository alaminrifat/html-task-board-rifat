# PATCH: Multi-Step Form Workflow

> **Adds to**: Missing workflow guide in `.claude/`
> **Problem**: No pattern for multi-step forms (onboarding, checkout, wizards)

---

## Architecture

```
MultiStepForm (parent)
├── StepIndicator (progress bar)
├── Step1_BasicInfo
├── Step2_Details
├── Step3_Review
└── NavigationButtons (back/next/submit)
```

---

## Implementation

### Types

```typescript
interface FormData {
  // Step 1
  name: string;
  email: string;
  // Step 2
  address: string;
  phone: string;
  // Step 3 = review (no new fields)
}

interface StepProps {
  data: FormData;
  onChange: (field: keyof FormData, value: string) => void;
  errors: Partial<Record<keyof FormData, string>>;
}
```

### Parent Component

```tsx
import { useState, useCallback } from 'react';

const TOTAL_STEPS = 3;

function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>({
    name: '', email: '', address: '', phone: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    // Clear error on edit
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const validateStep = (currentStep: number): boolean => {
    const newErrors: typeof errors = {};

    if (currentStep === 1) {
      if (!data.name.trim()) newErrors.name = 'Name is required';
      if (!data.email.trim()) newErrors.email = 'Email is required';
    }
    if (currentStep === 2) {
      if (!data.address.trim()) newErrors.address = 'Address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const next = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    }
  };

  const back = () => setStep(prev => Math.max(prev - 1, 1));

  const submit = async () => {
    if (!validateStep(step)) return;
    // API call
  };

  return (
    <div>
      <StepIndicator current={step} total={TOTAL_STEPS} />

      {step === 1 && <Step1 data={data} onChange={handleChange} errors={errors} />}
      {step === 2 && <Step2 data={data} onChange={handleChange} errors={errors} />}
      {step === 3 && <Step3Review data={data} />}

      <div className="flex justify-between mt-6">
        {step > 1 && <button onClick={back}>Back</button>}
        {step < TOTAL_STEPS
          ? <button onClick={next}>Next</button>
          : <button onClick={submit}>Submit</button>
        }
      </div>
    </div>
  );
}
```

### Step Indicator

```tsx
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map(num => (
        <div
          key={num}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
            ${num === current ? 'bg-blue-600 text-white' :
              num < current ? 'bg-green-500 text-white' :
              'bg-gray-200 text-gray-500'}`}
        >
          {num < current ? '✓' : num}
        </div>
      ))}
    </div>
  );
}
```

### Individual Step

```tsx
function Step1({ data, onChange, errors }: StepProps) {
  return (
    <div>
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          value={data.name}
          onChange={e => onChange('name', e.target.value)}
        />
        {errors.name && <span className="text-red-500">{errors.name}</span>}
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={data.email}
          onChange={e => onChange('email', e.target.value)}
        />
        {errors.email && <span className="text-red-500">{errors.email}</span>}
      </div>
    </div>
  );
}
```

### Review Step

```tsx
function Step3Review({ data }: { data: FormData }) {
  return (
    <div>
      <h3>Review Your Information</h3>
      <dl>
        <dt>Name</dt><dd>{data.name}</dd>
        <dt>Email</dt><dd>{data.email}</dd>
        <dt>Address</dt><dd>{data.address}</dd>
        <dt>Phone</dt><dd>{data.phone || 'Not provided'}</dd>
      </dl>
    </div>
  );
}
```

---

## Advanced: Persist Progress

```tsx
// Save to sessionStorage (SSR-safe) so users don't lose progress
import { useEffect } from 'react';

const STORAGE_KEY = 'multistep-form-draft';

function useFormPersist(data: FormData, step: number) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ data, step }));
      } catch {
        // Storage unavailable
      }
    }
  }, [data, step]);
}

function loadSavedForm(): { data: FormData; step: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}
```
