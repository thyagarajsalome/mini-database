#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Helper to ensure the file exists
void ensure_file_exists() {
    FILE *fp = fopen("data.txt", "a");
    if (fp) fclose(fp);
}

// INSERT Command
void insert_record(int id, const char *material_name, int unit_cost) {
    FILE *fp = fopen("data.txt", "a");
    if (fp == NULL) {
        printf("Error: Could not open database.\n");
        return;
    }
    fprintf(fp, "%d,%s,%d\n", id, material_name, unit_cost);
    fclose(fp);
    printf("SUCCESS: Inserted %s\n", material_name);
}

// SELECT Command
void select_records() {
    FILE *fp = fopen("data.txt", "r");
    if (fp == NULL) {
        printf("[]\n"); // Return empty array if no file
        return;
    }
    
    char line[256];
    printf("[\n");
    int first = 1;
    
    while (fgets(line, sizeof(line), fp)) {
        int id, cost;
        char name[100];
        // Parse the CSV line
        if (sscanf(line, "%d,%[^,],%d", &id, name, &cost) == 3) {
            if (!first) printf(",\n");
            // Output as JSON for easy Node.js parsing
            printf("  {\"id\": %d, \"name\": \"%s\", \"cost\": %d}", id, name, cost);
            first = 0;
        }
    }
    printf("\n]\n");
    fclose(fp);
}

int main(int argc, char *argv[]) {
    ensure_file_exists();

    if (argc < 2) {
        printf("Usage: ./db <COMMAND> [args...]\n");
        return 1;
    }

    if (strcmp(argv[1], "INSERT") == 0) {
        if (argc != 5) {
            printf("Usage: ./db INSERT <id> <name> <cost>\n");
            return 1;
        }
        insert_record(atoi(argv[2]), argv[3], atoi(argv[4]));
    } 
    else if (strcmp(argv[1], "SELECT") == 0) {
        select_records();
    } 
    else {
        printf("Unknown command: %s\n", argv[1]);
    }

    return 0;
}