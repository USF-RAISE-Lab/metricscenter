import axios from "axios";

const API_BASE_URL = "https://api.smartsheet.com/2.0";
const smartsheet = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.SMARTSHEET_API_TOKEN}`,
  },
});

export async function GET() {
  try {
    const columnMapping = {
      State: "State",
      Grant: "Type of Grant",
    };

    const response = await smartsheet.get(
      `/sheets/${process.env.SMARTSHEET_SHEET_ID}/columns`
    );
    const columns = response.data.data;

    const columnIdsPromises = Object.values(columnMapping).map(
      async (columnName) => {
        const column = columns.find((column) => column.title === columnName);
        if (!column) {
          throw new Error(`Column '${columnName}' not found in Smartsheet.`);
        }
        return column.id;
      }
    );
    const columnIds = await Promise.all(columnIdsPromises);

    const dropdownOptionsResponse = await smartsheet.get(
      `/sheets/${process.env.SMARTSHEET_SHEET_ID}/columns/${columnIds[0]}`
    );
    const dropdownOptions = dropdownOptionsResponse.data.options.map(
      (option) => ({ value: option })
    );

    const grantOptionsResponse = await smartsheet.get(
      `/sheets/${process.env.SMARTSHEET_SHEET_ID}/columns/${columnIds[1]}`
    );
    const grantOptions = grantOptionsResponse.data.options.map((option) => ({
      value: option,
    }));

    return new Response(JSON.stringify({ dropdownOptions, grantOptions }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching options from Smartsheet:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
