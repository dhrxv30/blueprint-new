import fitz
import re
import json
import uuid

# -------------------------------
# CONFIG
# -------------------------------
TOP_LEVEL_SECTIONS = [
    "TL;DR",
    "Goals",
    "User Stories",
    "Functional Requirements",
    "User Experience",
    "Core Experience",
    "Success Metrics",
    "Tracking Plan",
    "Technical Considerations",
    "Milestones & Sequencing"
]

SUBSECTION_MAP = {
    "Business Goals": "Goals",
    "User Goals": "Goals",
    "Non-Goals": "Goals",
    "Driver Flow": "Core Experience",
    "Restaurant Flow": "Core Experience",
    "Customer Flow": "Core Experience",
    "Narrative": "Core Experience"
}

ALL_SECTIONS = TOP_LEVEL_SECTIONS + list(SUBSECTION_MAP.keys())


# -------------------------------
# CLEAN TEXT
# -------------------------------
def clean_text(text):
    text = re.sub(r'\s+', ' ', text)

    # Existing fixes
    text = text.replace("Non-GoalsGoalsGoals", "Non-Goals")
    text = text.replace("Non-Goals Goals", "Non-Goals")

    # 🔥 Fix 1: "Non- ●" → "Non-Goals ●"
    text = text.replace("Non- ●", "Non-Goals ●")

    # 🔥 Fix 2: remove trailing junk tokens
    text = re.sub(r'\b(User|Customer|Restaurant)\s*$', '', text)

    return text.strip()

# -------------------------------
# MERGE LINES
# -------------------------------
def merge_lines(lines):
    merged = []
    buffer = ""

    for line in lines:
        line = clean_text(line)
        if not line:
            continue

        if buffer and not buffer.endswith((".", ":", "?", "!")):
            buffer += " " + line
        else:
            if buffer:
                merged.append(buffer)
            buffer = line

    if buffer:
        merged.append(buffer)

    return merged


# -------------------------------
# FORCE SECTION DETECTION
# -------------------------------
def detect_section(line):
    for section in ALL_SECTIONS:
        if section.lower() in line.lower():
            return section
    return None


# -------------------------------
# SPLIT INLINE SECTIONS
# -------------------------------
def split_sections(line):
    parts = []
    remaining = line

    for section in ALL_SECTIONS:
        if section in remaining and remaining != section:
            split = remaining.split(section)
            if split[0].strip():
                parts.append(("content", split[0].strip()))
            parts.append(("section", section))
            remaining = section.join(split[1:])

    if remaining.strip():
        parts.append(("content", remaining.strip()))

    return parts


# -------------------------------
# CHUNKING (section-aware)
# -------------------------------
def chunk_text(text, max_length=500):
    sentences = re.split(r'(?<=[.!?]) +', text)

    chunks = []
    current = ""

    for sentence in sentences:
        if len(current) + len(sentence) < max_length:
            current += " " + sentence
        else:
            if current.strip():
                chunks.append(current.strip())
            current = sentence

    if current.strip():
        chunks.append(current.strip())

    return chunks


# -------------------------------
# MAIN PARSER
# -------------------------------
def parse_pdf(file_path):
    doc = fitz.open(file_path)

    sections_dict = {}
    chunks_output = []

    current_section = None

    for page_num, page in enumerate(doc):
        lines = merge_lines(page.get_text("text").split("\n"))

        for line in lines:
            split_parts = split_sections(line)

            for part_type, part_text in split_parts:

                part_text = clean_text(part_text)
                if not part_text:
                    continue

                # -------------------------------
                # SECTION SWITCH
                # -------------------------------
                if part_type == "section":
                    title = part_text

                    if title not in sections_dict:
                        sections_dict[title] = {
                            "id": str(uuid.uuid4()),
                            "title": title,
                            "content": "",
                            "parent_id": None,
                            "page": page_num + 1
                        }

                    current_section = sections_dict[title]

                # -------------------------------
                # CONTENT
                # -------------------------------
                else:
                    if current_section is None:
                        # fallback
                        if "TL;DR" not in sections_dict:
                            sections_dict["TL;DR"] = {
                                "id": str(uuid.uuid4()),
                                "title": "TL;DR",
                                "content": "",
                                "parent_id": None,
                                "page": page_num + 1
                            }
                        current_section = sections_dict["TL;DR"]

                    current_section["content"] += " " + part_text

    # -------------------------------
    # SET HIERARCHY
    # -------------------------------
    for title, section in sections_dict.items():
        parent = SUBSECTION_MAP.get(title)
        if parent and parent in sections_dict:
            section["parent_id"] = sections_dict[parent]["id"]

    sections = list(sections_dict.values())

    # -------------------------------
    # REMOVE EMPTY
    # -------------------------------
    sections = [s for s in sections if s["content"].strip()]

    # -------------------------------
    # CREATE CHUNKS
    # -------------------------------
    for section in sections:
        chunks = chunk_text(section["content"])

        for chunk in chunks:
            if not chunk.strip():
                continue

            chunks_output.append({
                "id": str(uuid.uuid4()),
                "section_id": section["id"],
                "content": chunk.strip(),
                "page": section["page"]
            })

    return {
        "sections": sections,
        "chunks": chunks_output
    }


# -------------------------------
# RUN
# -------------------------------
if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input file provided"}))
        sys.exit(1)

    file_path = sys.argv[1]

    try:
        result = parse_pdf(file_path)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)