#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void ensure_file_exists() {
    FILE *fp = fopen("data.txt", "a");
    if (fp) fclose(fp);
}

void insert_record(int id, const char *material_name, int unit_cost) {
    FILE *fp = fopen("data.txt", "a");
    if (!fp) return;
    fprintf(fp, "%d,%s,%d\n", id, material_name, unit_cost);
    fclose(fp);
    printf("SUCCESS: Inserted %s\n", material_name);
}

void select_records() {
    FILE *fp = fopen("data.txt", "r");
    if (!fp) { printf("[]\n"); return; }
    
    char line[256];
    printf("[\n");
    int first = 1;
    
    while (fgets(line, sizeof(line), fp)) {
        int id, cost; char name[100];
        if (sscanf(line, "%d,%[^,],%d", &id, name, &cost) == 3) {
            if (!first) printf(",\n");
            printf("  {\"id\": %d, \"name\": \"%s\", \"cost\": %d}", id, name, cost);
            first = 0;
        }
    }
    printf("\n]\n");
    fclose(fp);
}

void delete_record(int target_id) {
    FILE *fp = fopen("data.txt", "r");
    FILE *temp = fopen("temp.txt", "w");
    if (!fp || !temp) return;

    char line[256];
    int found = 0;
    while (fgets(line, sizeof(line), fp)) {
        int id; sscanf(line, "%d", &id);
        if (id != target_id) {
            fputs(line, temp); // Keep it
        } else {
            found = 1; // Skip it
        }
    }
    fclose(fp); fclose(temp);
    remove("data.txt");
    rename("temp.txt", "data.txt");
    
    if (found) printf("SUCCESS: Deleted ID %d\n", target_id);
    else printf("ERROR: ID not found\n");
}

void update_record(int target_id, const char *new_name, int new_cost) {
    FILE *fp = fopen("data.txt", "r");
    FILE *temp = fopen("temp.txt", "w");
    if (!fp || !temp) return;

    char line[256];
    int found = 0;
    while (fgets(line, sizeof(line), fp)) {
        int id; sscanf(line, "%d", &id);
        if (id == target_id) {
            fprintf(temp, "%d,%s,%d\n", target_id, new_name, new_cost);
            found = 1;
        } else {
            fputs(line, temp);
        }
    }
    fclose(fp); fclose(temp);
    remove("data.txt");
    rename("temp.txt", "data.txt");

    if (found) printf("SUCCESS: Updated ID %d\n", target_id);
    else printf("ERROR: ID not found\n");
}

int main(int argc, char *argv[]) {
    ensure_file_exists();
    if (argc < 2) return 1;

    if (strcmp(argv[1], "INSERT") == 0 && argc == 5) {
        insert_record(atoi(argv[2]), argv[3], atoi(argv[4]));
    } else if (strcmp(argv[1], "SELECT") == 0) {
        select_records();
    } else if (strcmp(argv[1], "DELETE") == 0 && argc == 3) {
        delete_record(atoi(argv[2]));
    } else if (strcmp(argv[1], "UPDATE") == 0 && argc == 5) {
        update_record(atoi(argv[2]), argv[3], atoi(argv[4]));
    } else {
        printf("Unknown command or missing arguments\n");
    }
    return 0;
}