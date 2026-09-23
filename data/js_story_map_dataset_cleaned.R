library(tidyverse)
library(sf)
library(leaflet)

# setwd("~/path/to/your/folder")

# ---- 1. Load ----------------------------------------------------------------
complaints <- read_csv("cleaned_ppd_complaints.csv")
people     <- read_csv("ppd_complainant_demographics.csv")
key        <- read_csv("UpdatedKeyforMatchingCensusDatatoPhiladelphiaPoliceGeography.csv")
districts  <- st_read("Boundaries_District.shp")

names(districts)   # <- look at this. Which column holds the district number?
DIST_COL <- "DIST_NUM"   # change this if thcomplaints <- read_csv("ppd_complaints__2_.csv")


# The boundary file is in Web Mercator (EPSG:3857). If the .prj file is missing,
# R won't know that, so we tell it:
if (is.na(st_crs(districts))) st_crs(districts) <- 3857


# ---- 2. Clean complaints ----------------------------------------------------
# district_occurrence is the district number x 100 (e.g. 2500 = 25th District).
# The 2025 district map has no 4th or 6th District:
#   6th merged into the 9th (May 2024); 4th was folded into the 3rd.
complaints <- complaints |>
  mutate(
    district = round(district_column / 100),
    district = case_when(district == 6 ~ 9,
                         district == 4 ~ 3,
                         TRUE ~ district),
    # some categories have stray asterisks, e.g. "*VERBAL ABUSE" vs "VERBAL ABUSE"
    category = general_cap_classification |> str_remove_all("\\*") |> str_trim()
  ) |>
  filter(!is.na(district))          # 69 complaints have no district listed

cat("Complaints kept:", nrow(complaints), "\n")   # should be 3245


# ---- 3. Build the per-district summary tables -------------------------------
# 3a. Total complaints
by_district <- complaints |> count(district, name = "complaints")

# 3b. Population from the census key (block-group populations summed to district)
pop <- key |>
  group_by(district = DIST_NUM2025) |>
  summarise(population = sum(CenPOP2020))

# 3c. Complaint categories: keep the 5 biggest, lump the rest into "other"
by_category <- complaints |>
  mutate(category = fct_lump_n(category, 5) |> as.character() |>
           str_to_lower() |> str_replace_all("[^a-z]+", "_") |> str_remove("_$")) |>
  count(district, category) |>
  pivot_wider(names_from = category, values_from = n,
              names_prefix = "cat_", values_fill = 0)

# 3d. Complainant race. NOTE: this table has one row per COMPLAINANT, and a
#     complaint can have more than one, so these are people, not complaints.
by_race <- people |>
  inner_join(complaints |> select(complaint_id, district), by = "complaint_id") |>
  mutate(race = case_when(complainant_race %in% c("Black", "White", "Latino") ~ str_to_lower(complainant_race),
                          is.na(complainant_race) ~ "unknown",
                          TRUE ~ "other")) |>
  count(district, race) |>
  pivot_wider(names_from = race, values_from = n,
              names_prefix = "race_", values_fill = 0)


# ---- 4. Join everything onto the map polygons -------------------------------
map_data <- districts |>
  mutate(district = as.numeric(.data[[DIST_COL]])) |>
  select(district) |>
  left_join(by_district, by = "district") |>
  left_join(pop,         by = "district") |>
  left_join(by_category, by = "district") |>
  left_join(by_race,     by = "district") |>
  mutate(
    across(c(complaints, starts_with("cat_"), starts_with("race_")), ~ replace_na(.x, 0)),
    # complaints per 10,000 residents. The airport (77) has 0 residents -> NA
    per_1k = if_else(population > 0, round(complaints / population * 1000, 1), NA_real_)
  ) |>
  st_transform(4326)       # web maps need lon/lat (WGS84), not Web Mercator

# Quick check: one row per district, no missing complaint totals
print(st_drop_geometry(map_data) |> select(district, complaints, population, per_1k) |> arrange(desc(per_1k)))
stopifnot(nrow(map_data) == 21, sum(map_data$complaints) == nrow(complaints))


# ---- 5. Preview map (shows in RStudio's Viewer pane) -------------------------
pal <- colorNumeric("YlOrRd", map_data$per_1k, na.color = "#cccccc")

leaflet(map_data) |>
  addProviderTiles("CartoDB.Positron") |>
  addPolygons(
    fillColor = ~pal(per_1k), fillOpacity = 0.8, color = "white", weight = 1.5,
    highlightOptions = highlightOptions(weight = 3, color = "#333", bringToFront = TRUE),
    label = ~paste0("District ", district, ": ", complaints, " complaints",
                    ifelse(is.na(per_1k), "", paste0(" (", per_1k, " per 10,000 residents)")))
  ) |>
  addLegend(pal = pal, values = ~per_1k, title = "Complaints per<br>10,000 residents",
            na.label = "No residents (airport)")
# To color by raw counts instead, swap per_10k for complaints in pal, fillColor and addLegend.


# ---- 6. Export for the JavaScript template ----------------------------------
# One file: the polygons + all the numbers as properties. Leaflet, Mapbox,
# D3, etc. can all load this directly.
st_write(map_data, "district_complaints.geojson", delete_dsn = TRUE)

# Optional: the same numbers without geometry, handy for JS charts / tables
write_csv(st_drop_geometry(map_data), "district_complaints.csv")
