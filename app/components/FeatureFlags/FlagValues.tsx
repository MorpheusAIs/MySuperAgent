import React, { Suspense } from 'react';
import { FlagValues } from 'flags/react';
import { encryptFlagValues, type FlagValuesType } from 'flags';

// Component that encrypts flag values before rendering
async function ConfidentialFlagValues({ values }: { values: FlagValuesType }) {
  const encryptedFlagValues = await encryptFlagValues(values);
  return <FlagValues values={encryptedFlagValues} />;
}

// Main component to emit flag values to the DOM
export function EmitFlagValues({ values }: { values: FlagValuesType }) {
  // If FLAGS_SECRET is set, encrypt the values
  if (process.env.NEXT_PUBLIC_FLAGS_SECRET) {
    return (
      <Suspense fallback={null}>
        <ConfidentialFlagValues values={values} />
      </Suspense>
    );
  }
  
  // Otherwise, emit them as plain values
  return <FlagValues values={values} />;
}