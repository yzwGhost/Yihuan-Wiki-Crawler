from pathlib import Path


def main() -> None:
    project_root = Path(__file__).resolve().parents[1]
    crawler_entry = project_root / "python" / "crawler" / "main.py"
    data_dir = project_root / "data"
    print("Yihuan crawler Python workspace is ready.")
    print(f"Crawler entry: {crawler_entry}")
    print(f"Data directory: {data_dir}")
    print("Run python python/crawler/main.py with crawler arguments to start a real crawl.")


if __name__ == "__main__":
    main()
