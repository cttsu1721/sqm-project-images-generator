import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  coverPage: {
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#1a1a2e",
    color: "#ffffff",
  },
  coverContent: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  coverTitle: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#ffffff",
  },
  coverSubtitle: {
    fontSize: 16,
    color: "#cccccc",
    marginBottom: 40,
    textAlign: "center",
  },
  coverMeta: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    width: "80%",
  },
  coverMetaRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  coverMetaLabel: {
    fontSize: 10,
    color: "#888888",
    width: 100,
  },
  coverMetaValue: {
    fontSize: 10,
    color: "#ffffff",
    flex: 1,
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4a90d9",
    marginBottom: 40,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#4a90d9",
    paddingBottom: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  categoryDescription: {
    fontSize: 10,
    color: "#666666",
    marginTop: 4,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  imageContainer: {
    width: "48%",
    marginBottom: 15,
  },
  imageContainerFull: {
    width: "100%",
    marginBottom: 15,
  },
  image: {
    width: "100%",
    height: "auto",
    objectFit: "cover",
    borderRadius: 4,
  },
  imageMeta: {
    marginTop: 6,
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
  },
  imageName: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#333333",
  },
  imageScore: {
    fontSize: 8,
    color: "#666666",
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#888888",
  },
  promptBox: {
    backgroundColor: "#f9fafb",
    padding: 15,
    borderRadius: 4,
    marginTop: 20,
    marginBottom: 20,
  },
  promptLabel: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 8,
  },
  promptText: {
    fontSize: 11,
    color: "#333333",
    lineHeight: 1.5,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 30,
    marginBottom: 20,
  },
  statBox: {
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f0f4f8",
    borderRadius: 8,
    width: "30%",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  statLabel: {
    fontSize: 9,
    color: "#666666",
    marginTop: 4,
    textAlign: "center",
  },
});

// Category info
const CATEGORY_INFO: Record<string, { name: string; description: string }> = {
  hero_shots: {
    name: "Hero Shots",
    description: "Primary marketing images - website banners, brochure covers, planning submissions",
  },
  site_context: {
    name: "Site & Context",
    description: "How the building fits its neighbourhood - critical for planning permits",
  },
  architectural_features: {
    name: "Architectural Features",
    description: "Design thinking and quality detailing that differentiates from generic developments",
  },
  interior_spaces: {
    name: "Key Interior Spaces",
    description: "Livability and spatial quality - for buyer marketing and pre-sales",
  },
  spatial_experience: {
    name: "Spatial Experience",
    description: "Architectural quality beyond floor area - the wow factor",
  },
  lifestyle_atmosphere: {
    name: "Lifestyle & Atmosphere",
    description: "Emotional connection - help buyers imagine their life in this home",
  },
};

const CATEGORY_ORDER = [
  "hero_shots",
  "site_context",
  "architectural_features",
  "interior_spaces",
  "spatial_experience",
  "lifestyle_atmosphere",
];

interface ShowcaseImage {
  id: string;
  filename: string;
  url: string;
  variationType: string;
  category: string;
  name: string;
  isHero: boolean;
  consistencyScore: number;
  attempts: number;
  lowConfidence: boolean;
}

interface ProjectReportProps {
  images: ShowcaseImage[];
  projectInfo: {
    prompt: string;
    suburb?: string;
    projectType?: string;
  };
  parsed?: {
    style_keywords?: string[];
    materials?: string[];
    finish_level?: string;
    num_units?: number;
    storeys?: number;
  };
  jobId: string;
  createdAt?: string;
}

// Helper to convert local image path to base64 data URL for PDF
function getImageSource(image: ShowcaseImage, baseUrl: string): string {
  // For API route, we need full URL with base
  if (image.url.startsWith("/")) {
    return `${baseUrl}${image.url}`;
  }
  return image.url;
}

export function ProjectReport({
  images,
  projectInfo,
  parsed,
  jobId,
  createdAt,
}: ProjectReportProps) {
  // Group images by category
  const imagesByCategory = CATEGORY_ORDER.reduce(
    (acc, category) => {
      acc[category] = images.filter((img) => img.category === category);
      return acc;
    },
    {} as Record<string, ShowcaseImage[]>
  );

  // Calculate stats
  const totalImages = images.length;
  const passedImages = images.filter((img) => img.consistencyScore > 80).length;
  const averageScore = Math.round(
    images.reduce((sum, img) => sum + img.consistencyScore, 0) / images.length
  );

  const formatProjectType = (type?: string) => {
    if (!type) return "Development Project";
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatSuburb = (suburb?: string) => {
    if (!suburb) return "Melbourne";
    return suburb.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverContent}>
          <Text style={styles.logo}>SQM ARCHITECTS</Text>
          <Text style={styles.coverTitle}>
            {formatProjectType(projectInfo.projectType)}
          </Text>
          <Text style={styles.coverSubtitle}>
            {formatSuburb(projectInfo.suburb)} | Architectural Showcase Package
          </Text>

          <View style={styles.coverMeta}>
            <View style={styles.coverMetaRow}>
              <Text style={styles.coverMetaLabel}>Project ID:</Text>
              <Text style={styles.coverMetaValue}>{jobId.slice(0, 8)}...</Text>
            </View>
            <View style={styles.coverMetaRow}>
              <Text style={styles.coverMetaLabel}>Images:</Text>
              <Text style={styles.coverMetaValue}>{totalImages} generated</Text>
            </View>
            <View style={styles.coverMetaRow}>
              <Text style={styles.coverMetaLabel}>Quality Score:</Text>
              <Text style={styles.coverMetaValue}>
                {averageScore}% average | {passedImages}/{totalImages} passed
              </Text>
            </View>
            {parsed?.style_keywords && (
              <View style={styles.coverMetaRow}>
                <Text style={styles.coverMetaLabel}>Style:</Text>
                <Text style={styles.coverMetaValue}>
                  {parsed.style_keywords.join(", ")}
                </Text>
              </View>
            )}
            {parsed?.materials && (
              <View style={styles.coverMetaRow}>
                <Text style={styles.coverMetaLabel}>Materials:</Text>
                <Text style={styles.coverMetaValue}>
                  {parsed.materials.join(", ")}
                </Text>
              </View>
            )}
            {parsed?.finish_level && (
              <View style={styles.coverMetaRow}>
                <Text style={styles.coverMetaLabel}>Finish Level:</Text>
                <Text style={styles.coverMetaValue}>
                  {parsed.finish_level.charAt(0).toUpperCase() +
                    parsed.finish_level.slice(1)}
                </Text>
              </View>
            )}
            {createdAt && (
              <View style={styles.coverMetaRow}>
                <Text style={styles.coverMetaLabel}>Generated:</Text>
                <Text style={styles.coverMetaValue}>
                  {new Date(createdAt).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.footer}>
          <Text>Generated with AI | SQM Project Images Generator</Text>
          <Text>Page 1</Text>
        </View>
      </Page>

      {/* Project Brief Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.categoryTitle}>Project Brief</Text>
          <Text style={styles.categoryDescription}>
            Original description and generation statistics
          </Text>
        </View>

        <View style={styles.promptBox}>
          <Text style={styles.promptLabel}>PROJECT DESCRIPTION</Text>
          <Text style={styles.promptText}>{projectInfo.prompt}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalImages}</Text>
            <Text style={styles.statLabel}>Total Images</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{passedImages}</Text>
            <Text style={styles.statLabel}>Passed QC</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{averageScore}%</Text>
            <Text style={styles.statLabel}>Average Score</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>SQM Project Images Generator</Text>
          <Text>Page 2</Text>
        </View>
      </Page>

      {/* Category Pages */}
      {CATEGORY_ORDER.map((category, categoryIndex) => {
        const categoryImages = imagesByCategory[category];
        const info = CATEGORY_INFO[category];

        if (!categoryImages || categoryImages.length === 0) return null;

        return (
          <Page key={category} size="A4" style={styles.page}>
            <View style={styles.header}>
              <Text style={styles.categoryTitle}>{info.name}</Text>
              <Text style={styles.categoryDescription}>{info.description}</Text>
            </View>

            <View style={styles.imageGrid}>
              {categoryImages.map((image, imageIndex) => (
                <View
                  key={image.id}
                  style={
                    categoryImages.length === 1 || (image.isHero && imageIndex === 0)
                      ? styles.imageContainerFull
                      : styles.imageContainer
                  }
                >
                  <Image
                    style={styles.image}
                    src={image.url}
                  />
                  <View style={styles.imageMeta}>
                    <Text style={styles.imageName}>
                      {image.name}
                      {image.isHero ? " (Hero)" : ""}
                    </Text>
                    <Text style={styles.imageScore}>
                      Score: {image.consistencyScore}% | Attempts: {image.attempts}
                      {image.lowConfidence ? " | Low Confidence" : ""}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.footer}>
              <Text>SQM Project Images Generator</Text>
              <Text>Page {categoryIndex + 3}</Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}

export default ProjectReport;
