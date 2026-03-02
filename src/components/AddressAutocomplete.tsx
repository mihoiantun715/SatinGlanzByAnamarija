'use client';

import React, { useRef, useEffect, useState } from 'react';
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
  const isSelectingRef = useRef(false);
  const onPlaceSelectedRef = useRef(onPlaceSelected);

  // Keep the ref updated with the latest callback
  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'AIzaSyCx3mOepL7-LfPo9Pxyq-ZN4mnXoaNIexQ',
    libraries,
  });

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    const input = inputRef.current;

    // Initialize autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(input, {
      componentRestrictions: { country: 'de' }, // Restrict to Germany
      fields: ['address_components', 'formatted_address'],
      types: ['address'],
    });

    // Prevent Enter key from submitting form
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
    };
    input.addEventListener('keydown', handleKeyDown);

    // Store the last extracted street value
    let lastStreetValue = '';

    // Intercept input changes to prevent formatted address from showing
    const handleInput = (e: Event) => {
      if (isSelectingRef.current && lastStreetValue) {
        // Replace formatted address with our extracted street
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.value = lastStreetValue;
          }
        }, 0);
      }
    };
    input.addEventListener('input', handleInput);

    // Handle place selection
    const placeChangedListener = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      
      if (!place || !place.address_components) {
        isSelectingRef.current = false;
        return;
      }

      isSelectingRef.current = true;

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

      // Store the street value for the input interceptor
      lastStreetValue = fullStreet;

      // Update parent component with all data at once FIRST
      // This will trigger React to update all three fields
      onPlaceSelectedRef.current({
        street: fullStreet,
        city,
        postalCode,
      });

      // Then immediately update the input value to show only street
      if (inputRef.current) {
        inputRef.current.value = fullStreet;
      }

      // Reset flag after a delay
      setTimeout(() => {
        isSelectingRef.current = false;
        lastStreetValue = '';
      }, 200);
    });

    return () => {
      input.removeEventListener('keydown', handleKeyDown);
      input.removeEventListener('input', handleInput);
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded]);

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

  // Sync value to input when it changes from parent
  useEffect(() => {
    if (inputRef.current && !isSelectingRef.current) {
      inputRef.current.value = value;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Don't update if we're in the middle of selecting from autocomplete
    if (!isSelectingRef.current) {
      onChange(e.target.value);
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  );
}
