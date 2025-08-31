// Mass update for UI components - replace all @/lib/utils imports
sed -i 's|@/lib/utils|../../utils|g' src/components/ui/*.tsx