using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LittleTripMemo.Migrations
{
    /// <inheritdoc />
    public partial class AddTableIdToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TableId",
                table: "AspNetUsers",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TableId",
                table: "AspNetUsers");
        }
    }
}
