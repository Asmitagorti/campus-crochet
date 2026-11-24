# Postal place data attribution

`postal-places.json` is a reduced derivative of the data in
`@devzoy/indian-pincode-geo` version 2.1.0. It contains post office and district
names for delivery address validation. Regenerate it with
`node scripts/generate-postal-places.cjs` after updating that package.

> Department of Posts, Ministry of Communications, Government of India, 2020, All India
> Pincode Directory till last month, Open Government Data (OGD) Platform India,
> {source_updated_date}, https://www.data.gov.in/resource/all-india-pincode-directory-till-last-month.
> Released under NDSAP and licensed under Government Open Data License – India:
> https://www.data.gov.in/Godl

The upstream package's `DATA_LICENSE.md` supplies this attribution with a
`{source_updated_date}` placeholder. Its published package does not include the
source metadata needed to replace that placeholder.
