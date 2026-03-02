'use client';

import React, { useRef, useEffect } from 'react';
import { useLoadScript } from '@react-google-maps/api';

const libraries: ("places")[] = ["places"];

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (place: {
    street: string;
    city: string;
    postalCode: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelected,
  placeholder,
  className,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'AIzaSyCx3mOepL7-LfPo9Pxyq-ZN4mnXoaNIexQ',
    libraries,
  });

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    // Initialize autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'de' }, // Restrict to Germany
      fields: ['address_components', 'formatted_address'],
      types: ['address'],
    });

    // Handle place selection
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      
      if (!place || !place.address_components) {
        return;
      }

      let street = '';
      let streetNumber = '';
      let city = '';
      let postalCode = '';

      // Extract address components
      place.address_components.forEach((component) => {
        const types = component.types;

        if (types.includes('route')) {
          street = component.long_name;
        }
        if (types.includes('street_number')) {
          streetNumber = component.long_name;
        }
        if (types.includes('locality')) {
          city = component.long_name;
        }
        if (types.includes('postal_code')) {
          postalCode = component.long_name;
        }
      });

      // Combine street and number
      const fullStreet = streetNumber ? `${street} ${streetNumber}` : street;

      // Update parent component with all data at once
      onPlaceSelected({
        street: fullStreet,
        city,
        postalCode,
      });
    });

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onChange, onPlaceSelected]);

  if (loadError) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  if (!isLoaded) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        disabled
      />
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}
